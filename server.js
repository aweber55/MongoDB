var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var app = express();

var db = require("./models");
app.use(logger("dev"));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(express.static("public"));


//initialzie handlebars
var exphbs = require("express-handlebars");

app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);

app.set("view engine", "handlebars");



var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsScraper1";
//connect to mongoose
// mongoose.connect("mongodb://localhost/newsScraper1", {
//   useNewUrlParser: false
// });
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);
var mongooseURI = mongoose.connection;

mongooseURI.on("error", function (error) {
  console.log("mongoose error: ", error);
});
mongooseURI.once("open", function () {
  console.log("mongoose connection is good!");
});


app.get("/", function (req, res) {



  // First, we grab the body of the html with request
  request("https://www.nhl.com/", function (error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);

    // Now, we grab every h2 within an article tag, and do the following:
    $("h4.headline-link").each(function (i, element) {
      // Save an empty result object
      var result = {};
      result.title = $(this).text();
      // Add the text and href of every link, and save them as properties of the result object
      result.link = $(this).parent().attr("href");
      result.abstract = $(this).next("h5").text();
      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function (dbArticle) {

          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function (err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.redirect("/articles");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({}).limit(15)
    .exec(function (err, articles) {
      // Log any errors if the server encounters one
      if (err) {
        res.send("a find error occured");
      }
      // Otherwise, send the result of this query to the browser
      else {
        let hbsObject = {
          data: articles
        };
        console.log(articles);
        res.render("index", hbsObject);
        // console.log(articles);
        // If we were able to successfully find Articles, send them back to the client

      }

    });
});
app.get("/articles/saved", function (req, res) {
  console.log("getting articles");
  // Grab every document in the Articles collection
  db.Article.find({
    saved: true
  }).populate("notes").exec(function (err, articles) {
    // Log any errors if the server encounters one
    if (err) {
      res.send("a saved error occurred");
    }
    // Otherwise, send the result of this query to the browser
    else {
      let hbsObject = {
        data: articles
      };
      console.log(articles);
      res.render("saved", hbsObject);
      // console.log(articles);
      // If we were able to successfully find Articles, send them back to the client

    }

  });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({
      _id: req.params.id
    })
    // ..and populate all of the notes associated with it
    .populate("notes")
    .then(function (error, article) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      if (error) {
        console.log("this is an error");
      } else {
        res.json(article);
        // If an error occurred, send it to the client
      }
    });
});



// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (note) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({
        _id: req.params.id
      }, {
        $push: {
          notes: note
        }
      }, {
        new: true
      });
    })
    .then(function (article) {
      console.log(article);
      // If we were able to successfully update an Article, send it back to the client
      res.redirect("/articles/saved");
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.post("/articles/save/:id", function (req, res) {
  db.Article.findOneAndUpdate({
      _id: req.params.id
    }, {
      $set: {
        saved: true
      }
    })
    .then(function (article) {
      console.log(article);
      res.redirect("/articles");
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.post("/articles/unsave/:id", function (req, res) {
  db.Article.findOneAndUpdate({
      _id: req.params.id
    }, {
      $set: {
        saved: false
      }
    })
    .then(function (article) {
      console.log(article);
      res.redirect("/articles/saved");
    })
    .catch(function (err) {
      res.json(err);
    });
});


//connect to port 3000
var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("App running on port " + port + "!");
});