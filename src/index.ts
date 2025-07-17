import express from "express";

const app = express();
const PORT = 3000;

app.get("/api/vi/sign-up", (req, res) => {
  console.log("It's Working !!");
});

app.get("/api/vi/sign-in", (req, res) => {
  console.log("It's Working !!");
});

app.get("/api/vi/content", (req, res) => {
  console.log("It's Working !!");
});
app.get("/api/vi/brain/share", (req, res) => {
  console.log("It's Working !!");
});

app.listen(PORT, () => {
  console.log(`Server is running at 'http://localhost:${PORT}'`);
});
