var crypto = require('crypto');

var CIPHER_ALGORITHM = 'aes-256-ctr';

var aes256 = {
  encrypt: function(key, plaintext) {
    if (typeof key !== 'string' || !key) {
      throw new TypeError('Provided "key" must be a non-empty string');
    }
    if (typeof plaintext !== 'string' || !plaintext) {
      throw new TypeError('Provided "plaintext" must be a non-empty string');
    }

    var sha256 = crypto.createHash('sha256');
    sha256.update(key);

    // Initialization Vector
    var iv = Buffer.from("NiceteaLe+Mignon");
    var cipher = crypto.createCipheriv(CIPHER_ALGORITHM, sha256.digest(), iv);

    var ciphertext = cipher.update(Buffer.from(plaintext));
    var encrypted = Buffer.concat([iv, ciphertext, cipher.final()]).toString('base64');

    return encrypted;
  },


  decrypt: function(key, encrypted) {
    if (typeof key !== 'string' || !key) {
      throw new TypeError('Provided "key" must be a non-empty string');
    }
    if (typeof encrypted !== 'string' || !encrypted) {
      throw new TypeError('Provided "encrypted" must be a non-empty string');
    }

    var sha256 = crypto.createHash('sha256');
    sha256.update(key);

    var input = Buffer.from(encrypted, "base64");



    // Initialization Vector
    var iv = Buffer.from("NiceteaLe+Mignon");
    var decipher = crypto.createDecipheriv(CIPHER_ALGORITHM, sha256.digest(), iv);
    var ciphertext = input;
    //var plaintext = decipher.update(ciphertext);
    decipher.setAutoPadding(auto_padding=true);
    var plaintext = decipher.update(ciphertext, "base64", "utf-8")
    plaintext += decipher.final("utf-8");
    // plaintext = replace(plaintext, '0c', '').toString("utf-8");
    return cleanString(plaintext);
  }

};

function cleanString(input) {
    var output = "";
    for (var i=0; i<input.length; i++) {
        if (input.charCodeAt(i) > 37) {
            output += input.charAt(i);
        }
    }
    return output;
}

function AesCipher(key) {
  if (typeof key !== 'string' || !key) {
    throw new TypeError('Provided "key" must be a non-empty string');
  }
  Object.defineProperty(this, 'key', { value: key });
}

AesCipher.prototype.encrypt = function(plaintext) {
  return aes256.encrypt(this.key, plaintext);
};

AesCipher.prototype.decrypt = function(encrypted) {
  return aes256.decrypt(this.key, encrypted);
};

aes256.createCipher = function(key) {
  return new AesCipher(key);
};

module.exports = aes256;
