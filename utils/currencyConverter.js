if(process.env.NODE_ENV != "production"){
    require('dotenv').config()
}


const axios = require("axios");

const getExchangeRate = async (fromCurrency, toCurrency) => {
    try {
        

        if (!fromCurrency || !toCurrency) {
            throw new Error("Missing currency parameters");
        }
        
        const AAPI_KEY = process.env.API_KEY; // 🔹 Replace with your real key
        const url = `https://v6.exchangerate-api.com/v6/${AAPI_KEY}/latest/${fromCurrency}`;

       
        const response = await axios.get(url);
        

        
        return response.data.conversion_rates[toCurrency];  
    } catch (error) {
       
        console.error("Error fetching exchange rate:",error.message);
        return null;
    }
};

module.exports = getExchangeRate;
