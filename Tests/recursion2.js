//to compute the factorial.....n!
 var factional = function(n){
       if(n==1 || n == 0){
          return 1;
       }else{
	       console.log(n+'num');
	       console.log(factional(n-1)*n);
         return factional(n-1)*n;
	// console.log(factional(n-1)*n);//no output
       }
       //console.log(factional(n-1)*factional(n)+'a');//no output
      // console.log(factional(n-1)*n);//no output
 }
 console.log(factional(3));
