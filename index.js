// Set Up Project, Middleware, Database, etc...
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import pg from 'pg';
import ejs from 'ejs';

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "books",
  password: "SoL3@man1",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

// Get All Books From Database Sorted by Most Recent
async function getBooksByDate() {
  const result = await db.query(
    "SELECT * FROM books ORDER BY review_date DESC"
  );
  let books = []
  result.rows.forEach((book) => {
    books.push(book);
  });
  return books;
}

// Get All Books From Database Sorted by Highest Rating
async function getBooksByRating() {
  const result = await db.query(
    "SELECT * FROM books ORDER BY rating DESC"
  );
  let books = []
  result.rows.forEach((book) => {
    books.push(book);
  });
  return books;
}

// Load Home Page w/Books Ordered by Most Recent
app.get('/', async (req, res) => {
  const books = await getBooksByDate()

  res.render("index.ejs", {
    books: books,
  });
})

// Load Home Page w/Books Ordered by Rating When Selected on Nav Bar
app.get('/rating', async (req, res) => {
  const books = await getBooksByRating()

  res.render("index.ejs", {books: books,})
})

// Load New Review Page
app.get('/new', async (req, res) => {
  res.render('new.ejs')
})

// Load Review Page via a Given ISBN 
app.get('/:isbn', async (req, res) => {
  const isbn = req.params.isbn
  let book = {}
  try {
    const result = await db.query(
      "SELECT * FROM books WHERE isbn = ($1)",
      [isbn]
    );
    book = result.rows[0]
  } catch (err) {
    console.log(err);
  }
  res.render('review.ejs', {
    book: book
  })
})

// Load Edit Page via a Given ISBN and Autopopulate With Existing Data
app.get('/edit/:isbn', async (req, res) => {
  const isbn = req.params.isbn
  let book = {}

  try {
    const result = await db.query(
      "SELECT * FROM books WHERE isbn = ($1)",
      [isbn]
    );
    book = result.rows[0]
  } catch (err) {
    console.log(err);
  }
  res.render('edit.ejs', {
    book: book
  })
})

// Add New Review Data to Database and Reload Main Site
app.post('/new', async (req, res) => {
  const book = req.body
  try {
    await db.query(
      "INSERT INTO books (review_date, title, author, isbn, review, rating) VALUES ($1, $2, $3, $4, $5, $6)",
      [book.reviewDate, book.title, book.author, book.isbn, book.review, book.rating]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
})

// Update Database with Updated Review from the Edit Page
app.post('/edit', async (req, res) => {
  const book = req.body
  try {
    await db.query(
      "UPDATE books SET review_date = ($1), title = ($2), author = ($3), isbn = ($4), review = ($5), rating = ($6) WHERE isbn = ($4)",
      [book.reviewDate, book.title, book.author, book.isbn, book.review, book.rating]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
})

// Delete Posts in the Database
app.post("/delete", async (req, res) => {
  const isbn = req.body.deleteId

  try {
    await db.query('DELETE FROM books WHERE isbn = ($1)', [isbn]);
    res.redirect('/')
    
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).send('Internal Server Error'); // Send an error response
  }
  
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  