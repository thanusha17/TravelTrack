const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",  
        required: true 
    },
    destination: { type: String, required: true },
    inputCurrency: { type: String, required: true },  // User's local currency
    outputCurrency: { type: String, required: true }, // Currency for final report
    budget: { type: Number, required: true },
    expenses: [
        {
            category: String,  // Food, Stay, etc.
            amount: Number,
            currency: String,  // Currency in which expense was made
            date: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

// const Trip = mongoose.model("Trip", tripSchema);
// module.exports = Trip;
module.exports = mongoose.model("Trip", tripSchema);
