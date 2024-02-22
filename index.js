const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Schema, model } = mongoose;

const app = express();
const PORT = 3001;
const JWT_SECRET = 'my-32-character-ultra-secure-and-ultra-long-secret';
// Connect to MongoDB
mongoose.connect('mongodb+srv://pranavbhujbal2001:user@cluster0.eh7gy8i.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("connected to db")
});

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Define schema models for user

const headerSchema = new Schema({
  image: String,
});

const commentSchema = new Schema({
  text: String,
  user: String,
  email: String, 
  createdAt: { type: Date, default: Date.now }
});

const BlogSchema = new Schema({
  title: String,
  summary: String,
  content: String,
  image: String,
  category: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  comments: [commentSchema]
});
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  employeeId: String,
  disabled: { type: Boolean, default: false }
});

const PostModel2 = model('Header', headerSchema);
const BlogModel = model('Blog', BlogSchema);
const User = mongoose.model('User', userSchema)

app.use(bodyParser.json());



// Endpoint to create a new header

app.post('/header', async (req, res) => {
  try {
    const { image } = req.body;
    const newHeader = new PostModel2({image});
    const savedHeader = await newHeader.save();
    res.status(200).json(savedHeader);
  } catch (error) {
    console.error('Error creating header:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/header-data', async (req, res) => {
  try {
    const headerData = await PostModel2.find();
    console.log('Header Data:', headerData); 
    res.json(headerData);
  } catch (error) {
    console.error('Error fetching header:', error);
    res.status(500).json({ error: 'Error fetching header' });
  }
});
//Endpoint to get users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to disable a user by ID (for superadmin)
app.put('/users/:id/disable', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { disabled: true },
      { new: true }
    );
    if (updatedUser) {
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error disabling user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to enable a user by ID (for superadmin)
app.put('/users/:id/enable', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { disabled: false },
      { new: true }
    );
    if (updatedUser) {
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error disabling user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
//Endpoint to post blogs
app.post('/blogs', async (req, res) => {
  try {
    const { title, summary, content, image, category, status } = req.body;
    const newBlog = new BlogModel({ title, summary, content, image, category, status });
    const savedBlog = await newBlog.save();
    res.status(201).json(savedBlog);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json('Internal Server Error');
  }
});
//Endpoint to get all blogs
app.get('/blogs', async (req, res) => {
  try {
    const blogs = await BlogModel.find();
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json('Internal Server Error');
  }
});
//Endpoint to get blogs by id
app.get('/blogs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await BlogModel.findById(id);

    if (blog) {
      res.json(blog);
    } else {
      res.status(404).json({ error: 'Blog not found' });
    }
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
//Endpoint to get categories
app.get('/categories', async (req, res) => {
  try {
    const categories = await BlogModel.distinct('category');

    if (categories.length > 0) {
      res.json(categories);
    } else {
      res.status(404).json({ error: 'No categories found' });
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Endpoint to update a specific blog based on _id
app.put('/blogs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, content, image, category } = req.body;

    const updatedBlog = await BlogModel.findByIdAndUpdate(
      id,
      { title, summary, content, image, category },
      { new: true }
    );

    if (updatedBlog) {
      res.status(200).json(updatedBlog);
    } else {
      res.status(404).json({ error: 'Blog not found' });
    }
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
//Endpoint to delete blogs
app.delete('/blogs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPage = await BlogModel.findByIdAndDelete(id);

    if (deletedPage) {
      res.status(200).json(deletedPage);
    } else {
      res.status(404).json({ error: 'Page not found' });
    }
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Endpoint to register new admin
app.post('/register', async (req, res) => {
  const { name, email, password, employeeId } = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Create a new user
  const newUser = new User({
    name,
    email,
    password,
    employeeId,
  });

  try {
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
//Endpoint for admin login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    if (user.disabled) {
      return res.status(401).json({ error: 'Your account is disabled. Please contact the administrator.' });
    }

    const accessToken = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '1h' });

    // Send user's name along with other data in response
    res.status(200).json({ message: 'Login successful', accessToken, name: user.name });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Generate new access token
    const accessToken = jwt.sign({ email: decoded.email, name: decoded.name }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Endpoint to approve a pending blog post (for superadmin)
app.put('/blogs/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBlog = await BlogModel.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );
    if (updatedBlog) {
      res.status(200).json(updatedBlog);
    } else {
      res.status(404).json({ error: 'Blog not found' });
    }
  } catch (error) {
    console.error('Error approving blog:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to reject a pending blog post (for superadmin)
app.put('/blogs/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBlog = await BlogModel.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true }
    );
    if (updatedBlog) {
      res.status(200).json(updatedBlog);
    } else {
      res.status(404).json({ error: 'Blog not found' });
    }
  } catch (error) {
    console.error('Error rejecting blog:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to fetch all pending blog posts (for superadmin)
app.get('/pending', async (req, res) => {
  try {
    const pendingBlogs = await BlogModel.find({ status: 'pending' });
    res.json(pendingBlogs);
  } catch (error) {
    console.error('Error fetching pending blogs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for superadmin login
app.post('/superadmin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the email domain is allowed for superadmins
    if (!isValidEmail(email)) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    // Authenticate superadmin user
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate access token
    const accessToken = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '1h' });

    // Generate refresh token
    const refreshToken = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET);

    res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to check if the email domain is allowed for superadmins
function isValidEmail(email) {
  const allowedDomain = 'pranav.bhujbal@walsystems.in';
  const domain = email
  return domain === allowedDomain;
}

// Endpoint to add a new comment to a blog post
app.post('/blogs/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, user, email } = req.body;
    // Find the blog post by ID
    const blog = await BlogModel.findById(id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    // Add the new comment to the blog post
    blog.comments.push({ text, user , email});
    // Save the updated blog post
    const updatedBlog = await blog.save();
    res.status(201).json(updatedBlog);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to fetch all comments for a specific blog post
app.get('/blogs/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    // Find the blog post by ID and populate the comments field
    const blog = await BlogModel.findById(id).select('comments');
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json(blog.comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to delete a comment by ID
app.delete('/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await BlogModel.findOne({ 'comments._id': id });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    blog.comments.pull(id);
    const updatedBlog = await blog.save();
    res.status(200).json(updatedBlog);
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
