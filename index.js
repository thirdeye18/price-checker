require('dotenv').config();

const SneaksAPI = require('sneaks-api');
const sneaks = new SneaksAPI();

const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));

const MessagingResponse = require('twilio').twiml.MessagingResponse;

//dummy subscribers
const Subscribers = [
  {
    "number": 3606891987,
    "styleID": "FY2903",
    "lastResellPrice": 475
  },
  {
    "number": 3609195808,
    "styleID": "DD0587-600",
    "lastResellPrice": 285
  }
];

// ========================
// Routes
// ========================

app.post('/sms', async (req, res) => {
  const twiml = new MessagingResponse();
  const SMS = twiml.message();
  const recievedSMS = req.body.Body.toLowerCase().trim();
  const firstWord = recievedSMS.split(" ")[0];
  
  if (firstWord == 'track'){
     const styleID = recievedSMS.split(" ")[1] || null;
     if(styleID){
      const sneaker = await sneaksApiFunctionWrapper(styleID);
      if(!sneaker){
          SMS.body("Sneaker could not be found");
      } else {
          const sub = {        
              "number": req.body.From,
              "styleID": sneaker.styleID,
              "lastResellPrice": sneaker.price
          };
          Subscribers.push(sub);
          SMS.media(sneaker.image);
          SMS.body(`Current lowest price for ${sneaker.name} is $${String(sneaker.price)} at ${sneaker.site}: ${sneaker.url}\nYou will be notified when the price drops. Reply STOP to opt-out of alerts.`);
      }
  }  
  } else {
     SMS.body('To start tracking a sneaker, text \"track\" followed by the sneaker ID.');
  }
  
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());

  function sneaksApiFunctionWrapper(styleID) {
    return new Promise((resolve, reject) => {
        sneaks.getProductPrices(styleID, function(err, product){
            const lowestResellSite = Object.keys(product.lowestResellPrice).reduce((a, b) => product.lowestResellPrice[a] > product.lowestResellPrice[b] ? a : b);
            const sneaker = {
                name: product.shoeName,
                image: product.thumbnail,
                site: lowestResellSite,
                price: product.lowestResellPrice[lowestResellSite],
                url: product.resellLinks[lowestResellSite],
                styleID: product.styleID
            };
            resolve(sneaker);
        }, (errorResponse) => {
            reject(errorResponse);
        });
    });
 }
});

app.listen(3000, () => {
   console.log('Express server listening on port 3000');
});