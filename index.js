const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();

const app = express();



/* -------------------------------------------------------------------------- */
/*                                 MIDDLEWARE                                 */
/* -------------------------------------------------------------------------- */
app.use(express.json())
app.use(cors())

/* -------------------------------------------------------------------------- */
/*                                   ROUTES                                   */
/* -------------------------------------------------------------------------- */
app.get('/', (req, res) => {
    res.send('Photography server is running')
})




const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yq2vgbi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const userCollection = client.db("photographyDB").collection('users')
    const classCollection = client.db("photographyDB").collection('classes')

/* -------------------------------------------------------------------------- */
/*                                  GET ROUTE                                 */
/* -------------------------------------------------------------------------- */


    


    /* -------------------------------------------------------------------------- */
    /*                                    POST ROUTE                                */
    /* -------------------------------------------------------------------------- */
        app.post("/users", async (req, res) => {
          const user = req.body;
          const query = { email: user.email };
          const existingUser = await userCollection.findOne(query);
          if (existingUser) {
            return res.send({ message: "user already exists" });
          }
          const result = await userCollection.insertOne(user);

          res.send(result);
        });


        app.post('/class',async(req, res) => {
            const body = req.body;

            console.log(body);
            const result = await classCollection.insertOne(body)
            res.send(result)
        })

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Database is connected😀😀😀 "
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

/* -------------------------------------------------------------------------- */
/*                                  LISTENER                                  */
/* -------------------------------------------------------------------------- */

app.listen(port, ()=>{
    console.log(`Photography is listening on port ${port}`);
})