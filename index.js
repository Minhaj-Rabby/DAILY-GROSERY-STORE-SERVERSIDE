const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

//use middlewere
app.use(cors());
app.use(express.json());

//app is running or not check in browser

app.get("/", (req, res) => {
    res.send("running my grosery server");
});

//listening server in my local host

app.listen(port, () => {
    console.log("Server is running");
});

//uri and client create

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.okup2.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

async function run() {
    try {
        await client.connect();
        const groseryCollection = client
            .db("foodExpress")
            .collection("groseryItems");
        const sellCollection = client
            .db("foodExpress")
            .collection("sellProducts");
        const soldCollection = client
            .db("foodExpress")
            .collection("soldProductsUniq");
        
        app.post("/login", async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(
                user,
                process.env.ACCESS_TOKEN_SECRET,
                {
                    expiresIn: "1d",
                }
            );

            res.send({ accessToken });
        });

        //get all items from database
        app.get("/products", async (req, res) => {
            const size = parseInt(req.query.size);

            const query = {};
            const cursor = groseryCollection.find(query);
            let products;
            if (size) {
                products = await cursor.limit(size).toArray();
            } else {
                products = await cursor.toArray();
            }
            res.send(products);
        });

        //get one item data
        app.get("/products/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await groseryCollection.findOne(query);

            res.send(result);
        });
        
        //update one item data

        app.put("/products/:id", async (req, res) => {
            const id = req.params.id;
            const updateProduct = req.body;

            const query = { _id: ObjectId(id) };
            const option = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity: updateProduct.quantity,
                },
            };
            const result = await groseryCollection.updateOne(
                query,
                updateDoc,
                option
            );
            res.send(result);
        });

        //sell item update

        app.put("/sellProducts", async (req, res) => {
            //const id = req.params.id;
            const updateProduct = req.body;
            const query = { productId: updateProduct.productId };
            const option = { upsert: true };
            const result = await sellCollection.findOne(query);
            let updateDoc;
            if (result) {
                updateDoc = {
                    $set: {
                        productId: updateProduct.productId,
                        productName: updateProduct.productName,
                        quantity:
                            parseInt(result.quantity) +
                            parseInt(updateProduct.quantity),
                        deliverUser: updateProduct.deliverUser,
                    },
                };
            } else {
                updateDoc = {
                    $set: {
                        productId: updateProduct.productId,
                        productName: updateProduct.productName,
                        quantity: parseInt(updateProduct.quantity),
                        deliverUser: updateProduct.deliverUser,
                    },
                };
            }
            const resultSend = await sellCollection.updateOne(
                query,
                updateDoc,
                option
            );
            res.send(resultSend);
        });

    } finally {

    }
}

run().catch(console.dir);

