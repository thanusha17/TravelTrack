if(process.env.NODE_ENV != "production"){
    require('dotenv').config()
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate")

const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const User = require("./models/user.js");
const Trip = require("./models/trip.js");
const { saveUrl } = require("./middleware.js");
const { isLoggedIn } = require("./middleware.js");
const getExchangeRate = require("./utils/currencyConverter.js");

const dbURL = "mongodb://127.0.0.1:27017/traveltrack";
// const dbURL = process.env.ATLASDB_URL;

main().then((res)=>{
    console.log("Connected to DB");
}).catch(err => console.log(err));

async function main() {
  await mongoose.connect(dbURL);
}

const store = MongoStore.create({ 
    mongoUrl: dbURL,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600,
});

store.on("error",()=>{
    console.log("Error on mongo session store",err);
})

const sessionInfo = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires:Date.now + 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true
    }
  }

  app.use(session(sessionInfo));
  app.use(flash());
  
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy(User.authenticate()));
  
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')));

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})




app.get("/signup",async (req,res)=>{
    res.render("signup.ejs");
})


app.post("/signup",async (req,res)=>{
    try{
    let {username, email, password} = req.body;
   const newUser = new User({email, username});
   let registeredUser = await User.register(newUser,password);
//    console.log(registeredUser);
   req.login(registeredUser, function(err) {
    if (err) { 
        return next(err); 
    }
    req.flash("success","Welcome to TravelTrack!");
   res.redirect("/");
  });
}catch(e){
        req.flash("error",e.message);
        console.log("Signup Error:", e.message);
        res.redirect("/signup");
    }
})

app.get("/login",async (req,res)=>{
    res.render("login.ejs");
})

app.post("/login",
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
    async (req,res)=>{
        req.flash("success","Welcome back to TravelTrack!");
        let redirectUrl = res.locals.redirectUrl || "/";
        res.redirect(redirectUrl);
    })

app.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","You have Logged out!");
        res.redirect("/");
    })
})

app.get("/trips", isLoggedIn, async (req, res) => {
    try {
        const trips = await Trip.find({ user: req.user._id });
       res.render("trips.ejs", { trips });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/trips/new", isLoggedIn, async (req, res) => {
    res.render("newTrip.ejs");
});

app.post("/trips", isLoggedIn, async (req, res) => {
    try {
        const { destination, budget, inputCurrency, outputCurrency } = req.body;

        const newTrip = new Trip({
            user: req.user._id, // Logged-in user's ID
            destination,
            budget,
            inputCurrency,
            outputCurrency,
            expenses: [] // Initially empty
        });

        await newTrip.save();
        res.redirect("/trips"); // Redirect to trips page
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});



app.get("/trips/:id", async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).send("Trip not found");

        let groupedExpenses = {};

        for (let expense of trip.expenses) {
            const category = expense.category;
            if (!groupedExpenses[category]) {
                groupedExpenses[category] = {
                    amount: 0,
                    convertedAmount: 0
                };
            }

            groupedExpenses[category].amount += expense.amount;

            if (expense.currency !== trip.outputCurrency) {
                const rate = await getExchangeRate(expense.currency, trip.outputCurrency);
                groupedExpenses[category].convertedAmount += expense.amount * (rate || 1);
            } else {
                groupedExpenses[category].convertedAmount += expense.amount;
            }
        }

        let totalSpentInputCurrency = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Convert to output currency
        let exchangeRate = await getExchangeRate(trip.inputCurrency, trip.outputCurrency);
        let totalSpentOutputCurrency = totalSpentInputCurrency * (exchangeRate || 1);

        res.render("trip-details", { trip, totalSpentInputCurrency, totalSpentOutputCurrency,groupedExpenses });

        // res.render("trip-details", { trip, groupedExpenses });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/trips/:id/add-expense", async (req, res) => {
    try {
        const { category, amount, currency } = req.body;
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).send("Trip not found");

        trip.expenses.push({ category, amount, currency });
        await trip.save();

        res.redirect(`/trips/${trip._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding expense");
    }
});


app.get("/",(req,res)=>{
    res.render("home.ejs");
})

app.listen(8080, ()=>{
    console.log("Server is listening to port 8080");
});