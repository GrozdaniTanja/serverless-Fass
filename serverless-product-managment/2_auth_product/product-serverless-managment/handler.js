'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const docClient = new AWS.DynamoDB.DocumentClient({
  endpoint: 'http://127.0.0.1:4566', // Local DynamoDB endpoint
  region: 'us-east-1'
});

const TABLE_NAME = process.env.PRODUCTS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to validate JWT
const authenticateJWT = (product) => {
  const token = product.headers.Authorization || product.headers.authorization;
  if (!token) {
    throw new Error('No token provided');
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Unauthorized');
  }
};

// Create Product
module.exports.createProduct = async (product) => {
  try {
    const user = authenticateJWT(product); // Validate the token
    const { name, description, date } = JSON.parse(product.body);
    const id = uuid.v4();
    const newProduct = { id, name, description, date };
    await docClient.put({
      TableName: TABLE_NAME,
      Item: newProduct
    }).promise();

    // Auto-invoke sendProductSummary after creating an product
    await module.exports.sendProductSummary();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Product created', product: newProduct, user })
    };
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: error.message })
    };
  }
};

// Get All Products
module.exports.getProducts = async () => {
  const data = await docClient.scan({ TableName: TABLE_NAME }).promise();
  return {
    statusCode: 200,
    body: JSON.stringify(data.Items)
  };
};

// Get Product by ID
module.exports.getProductById = async (product) => {
  const { id } = product.pathParameters;
  const data = await docClient.get({
    TableName: TABLE_NAME,
    Key: { id }
  }).promise();
  if (!data.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Product not found' })
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify(data.Item)
  };
};

// Update Product
module.exports.updateProduct = async (product) => {
  const { id } = product.pathParameters;
  const { name, description, date } = JSON.parse(product.body);
  await docClient.update({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set name = :name, description = :description, date = :date',
    ExpressionAttributeValues: {
      ':name': name,
      ':description': description,
      ':date': date
    }
  }).promise();
  return {
    statusCode: 200,
    body: JSON.stringify({ id, name, description, date })
  };
};

// Delete Product
module.exports.deleteProduct = async (product) => {
  const { id } = product.pathParameters;
  await docClient.delete({
    TableName: TABLE_NAME,
    Key: { id }
  }).promise();
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Product deleted successfully' })
  };
};

// Send Product Summary
module.exports.sendProductSummary = async () => {
  // Fetch upcoming products from the database
  const data = await docClient.scan({ TableName: TABLE_NAME }).promise();
  // Compose email content
  const emailContent = `Upcoming Products:\n\n${data.Items.map(product => `${product.name} - ${product.date}`).join('\n')}`;
  // Mock sending email
  console.log('Sending email with content:', emailContent);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Product summary sent successfully' })
  };
};

// Hourly Task
module.exports.hourlyTask = async () => {
  console.log('Hourly task running...');
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hourly task executed successfully' })
  };
};

// Handle SNS Notification
module.exports.handleSnsNotification = async (product) => {
  for (const record of product.Records) {
    const snsMessage = record.Sns.Message;
    console.log('SNS Message:', snsMessage);
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'SNS notification processed successfully' })
  };
};