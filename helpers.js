import sharp from "sharp";

const TYPESIMAGES = ["image/jpeg", "image/png", "image/bmp"];

function isDocument(document) {
  return document ? true : false;
}

function isCorrectTypeImage(type) {
  return TYPESIMAGES.includes(type) ? true : false;
}

function isNumberInRange(num, min, max) {
  return Number(num) >= min && Number(num) <= max;
}

function blurImage(num, buffer) {
  return sharp(Buffer.from(buffer)).blur(Number(num)).toBuffer();
}

function flipImage(buffer) {
  return sharp(Buffer.from(buffer)).flip().toBuffer();
}

function flopImage(buffer) {
  return sharp(Buffer.from(buffer)).flop().toBuffer();
}

function getArrayBufferImage(link) {
  return fetch(link).then((res) => res.arrayBuffer());
}

function validateNumber(number) {
  return !isNaN(number) && isNumberInRange(number, 0.3, 1000) ? true : false;
}

export {
  isDocument,
  isCorrectTypeImage,
  validateNumber,
  getArrayBufferImage,
  blurImage,
  flipImage,
  flopImage,
};
