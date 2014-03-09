//to compute a expression like :2/1 + 3/2 +5/3 + 8/5 + a/b+ (a+b)/a;
//the rule is denominator(分母) is the previous items' numerator(分子),and the numerator is the pre items' sum of denominator+numerator.
var denominator =function(n){
     if(n == 1){
        return 1;
     }else{
        return numerator(n-1);
     }
}

var numerator = function(n){
    if(n ==1){
       return 2;
    }else{
      return numerator(n-1) + denominator(n-1);
    }
}
//var sum =0;
   function expression(n){
//	var sum =0;   
//   var n =2;
   var sum =0; 
   //when i= 0, will have range error ,call back size exceeded.
   for(var i=1;i<=n;i++){
       sum += numerator(i)/denominator(i);
     }
    console.log(sum)
   }
expression(3)

