const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const port = 3000;

app.use(cors());
app.use(express.json());

function createToken(user) {
  const token = jwt.sign(
    {
      email: user.email,
    },
    "secret",
    { expiresIn: "7d" }
  );
  return token;
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  const verify = jwt.verify(token, "secret");
  if (!verify?.email) {
    return res.send("You are not authorized");
  }
  req.user = verify.email;
  next();
}

const uri = process.env.DATABASE_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const productDB = client.db("productDB");
    const phoneCollection = productDB.collection("phoneCollection");
    const userDB = client.db("userDB");
    const userCollection = userDB.collection("userCollection");

    // single Phone post
    app.post("/phones", async (req, res) => {
      const phoneData = req.body;
      const result = await phoneCollection.insertOne(phoneData);
      res.send(result);
    });

    // all phone get
    app.get("/phones", async (req, res) => {
      const data = await phoneCollection.find().toArray();
      res.send(data);
    });

    // single product with id
    app.get("/phones/:id", async (req, res) => {
      const id = req.params.id;
      const result = await phoneCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Edit Phone
    app.patch("/phones/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const phoneData = req.body;
      const result = await phoneCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: phoneData }
      );
      res.send(result);
    });

    // Delete
    app.delete("/phones/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await phoneCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // user info post
    app.post("/user", async (req, res) => {
      const user = req.body;
      const token = createToken(user);
      const isExist = await userCollection.findOne({ email: user?.email });
      if (isExist?.email) {
        return res.send({
          status: "success",
          message: "User already exist",
          token,
        });
      }
      await userCollection.insertOne(user);
      res.send({ token });
    });

    // single user get
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email: email });
      res.send(result);
    });

    // single user get
    app.get("/user/get/:id", async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // user Update
    app.patch("/user/:email", async (req, res) => {
      const email = req.params.email;
      const userData = req.body;
      const result = await userCollection.updateOne(
        { email },
        { $set: userData },
        { upsert: true }
      );
      res.send(result);
    });

    console.log("MongoDB connected successfully");
    await client.db("admin").command({ ping: 1 });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, (res, req) => {
  console.log(`Server is running on port ${port}`);
});
