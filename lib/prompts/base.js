/**
 * Base prompt implementation
 * Should be extended by prompt types.
 */

var _ = require("lodash");
var utils = require("../utils/utils");
var clc = require("cli-color");
var charm = process.charm;


/**
 * Module exports
 */

module.exports = Prompt;


/**
 * Prompt constructor
 */

function Prompt(question, rl) {

  // Setup instance defaults property
  _.assign(this, {
    height   : 0,
    answered : false
  });

  // Set defaults prompt options
  this.opt = _.defaults(question, {
    validate: function() { return true; },
    filter: function(val) { return val; }
  });

  // Normalize choices
  if (_.isArray(this.opt.choices)) {
    this.opt.choices = utils.normalizeChoices(this.opt.choices);
  }

  this.rl = rl;

  return this;
}


/**
 * Start the Inquiry session
 * @param  {Function} cb  Callback when prompt is done
 * @return {this}
 */

Prompt.prototype.run = function(cb) {
  var self = this;
  this._run(function(value) {
    self.filter(value, cb);
  });
  return this;
};

// noop
Prompt.prototype._run = function(cb) {
  cb();
};


/**
 * Remove the prompt to screen
 * @param  {Number}  Extra lines to remove (probably to compensate the "enter" key line
 *                   return)
 * @return {Prompt}  self
 */

Prompt.prototype.clean = function(extra) {
  if (!_.isNumber(extra)) {
    extra = 0;
  }
  utils.cleanLine(this.height + extra);
  charm.left(300).display("reset");
  return this;
};


/**
 * Write error message
 * @param {String} Error   Error message
 * @return {Prompt}        Self
 */

Prompt.prototype.error = function(error) {
  charm.erase("line");
  charm.foreground("red").write(">> ").display("reset")
    .write(error || "Please enter a valid value");
  charm.up(1);
  return this;
};


/**
 * Valid a given input
 * @param  {String} value     Input string
 * @return {Boolean|String}   Return `true` if input is valid or return error message.
 *                            if no error message is provided, a default one will be used.
 */

Prompt.prototype.validate = function(input, cb) {
  var async = false;
  var isValid = this.opt.validate.call({
    async: function() {
      async = true;
      return _.once(cb);
    }
  }, input);

  if (!async) {
    cb(isValid);
  }
};


/**
 * Filter a given input before sending back
 * @param  {String} value Input string
 * @return {mixed}        Return filtered input
 */

Prompt.prototype.filter = function(input, cb) {
  var async = false;
  var output = this.opt.filter.call({
    async: function() {
      async = true;
      return _.once(cb);
    }
  }, input);

  if (!async) {
    cb(output);
  }
};


/**
 * Return the prompt line prefix
 * @param  {String} [optionnal] String to concatenate to the prefix
 * @return {String} prompt prefix
 */

Prompt.prototype.prefix = function(str) {
  str || (str = "");
  return "[" + clc.green("?") + "] " + str;
};


/**
 * Return the prompt line suffix
 * @param  {String} [optionnal] String to concatenate to the suffix
 * @return {String} prompt suffix
 */

Prompt.prototype.suffix = function( str ) {
  str || (str = "");
  return str + ": ";
};


/**
 * Generate the prompt question string
 * @return {String} prompt question string
 */

Prompt.prototype.getQuestion = function() {

  var message = this.prefix() + this.opt.message + this.suffix();

  if ( this.opt.default && !this.answered ) {
    message += "("+ this.opt.default + ") ";
  }

  return message;
};