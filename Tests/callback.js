//example1: from:http://recurial.com/programming/understanding-callback-functions-in-javascript/
function some_function(arg1, arg2, callback) {
	// this generates a random number between
	// arg1 and arg2
	var my_number = Math.ceil(Math.random() *
		(arg1 - arg2) + arg2);
	// then we're done, so we'll call the callback and
	// pass our result
	callback(my_number);
}
// call the function
some_function(5, 15, function(num) {
	// this anonymous function will run when the
	// callback is called
	console.log("callback called! " + num);
});
//example2.js
var func_multiply = new Function("arg1"," arg2"," return arg1 * arg2");
func_multiply(5,10); // => 50
