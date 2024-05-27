
'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid');

const docClient = new AWS.DynamoDB.DocumentClient({
  endpoint: 'http://127.0.0.1:4566', // Localstack DynamoDB endpoint
  region: 'us-east-1'
});

const TABLE_NAME = process.env.PRODUCTS_TABLE;

// Create Product
module.exports.createProduct = async (product) => {
  const { name, description, date } = JSON.parse(product.body);
  const id = uuid.v4();
  const newProduct = { id, name, description, date };
  await docClient.put({
    TableName: TABLE_NAME,
    Item: newProduct
  }).promise();
  return {
    statusCode: 201,
    body: JSON.stringify(newProduct)
  };
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