const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer')
const upload = multer();
const cors = require('cors')
const session = require('express-session');
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 900000 }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    exposedHeaders: ['X-Custom-Header'],
    credentials: true,
  })
);
app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/Username', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB (Username)');
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
  });

const userSchema = new mongoose.Schema({
  userName: String,
  userPassword: String
});

const userAccount = mongoose.model('userAccount', userSchema);

app.post('/db/create', (request, response) => {
  let form = request.body;
  let data = {
    userName: form.name || '',
    userPassword: form.password || ''
  };

  userAccount.create(data)
    .then(() => {
      response.send({ success: true });
    })
    .catch(err => {
      console.error(err);
      response.send({ success: false });
    });
});

  const productSchema = new mongoose.Schema({
    productName: String,
    productDescription: String,
    productPrice: Number,
    productImage: {
      data: Buffer, 
      contentType: String,
    },
  });

  const Product = mongoose.model('Product', productSchema);

  app.post('/products/create', upload.single('productImage'), (req, res) => {
    const form = req.body;
    const data = {
      productName: form.productName || '',
      productDescription: form.productDescription || '',
      productPrice: form.productPrice || 0,
      productImage: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
    };

    Product.create(data)
      .then(() => {
        res.json({ success: true });
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
      });
  });

  app.get('/products/read', async (req, res) => {
    try {
      const products = await Product.find().exec();
      const productsWithImageDataUrls = products.map(product => {
        const base64Data = product.productImage.data.toString('base64');
        const dataUrl = `data:${product.productImage.contentType};base64,${base64Data}`;
  
        return {
          ...product._doc,
          productImage: dataUrl,
        };
      });
      res.json(productsWithImageDataUrls);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'An error occurred', message: error.message });
    }
  });
  
  app.post('/Username/login', async (req, res) => {
    const { userName, userPassword } = req.body;
    const user = await userAccount.findOne({ userName, userPassword }).exec();
  
    if (user) {
      req.session.user = user;
      console.log('Session created:', req.session.user);
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'Invalid username or password' });
    }
  });

  app.delete('/products/:id', (req, res) => {
    const productId = req.params.id;
    
    Product.findByIdAndDelete(productId)
      .exec()
      .then(deletedProduct => {
        if (!deletedProduct) {
          return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.status(204).json({ success: true, message: 'Product deleted successfully' });
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
      });
  });