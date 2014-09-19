///////////////////iterator algorithm achieved by javascript////////////////
//兔子繁殖问题
// 新生的兔子从下一个月开始新生一只兔子，问到n个月时，有多少只兔子？
    function rabbit(n){
        var a=0; 
        while(n>1){
          a += 2*(n-1);
          n--;
       console.log(a+'a')
         }
       console.log(a+'a')
    }
         rabbit(12);

   function rabbit2(n){
       var a =0;
       for(var i=2;i<=n;i++){
        a += 2*(i-1);
      console.log(a+'b');
       }
      console.log(a+'b')
    }
    rabbit2(12)
      
   var i=0;
   function recursion(n){
      if(n <= 1){
          return 1;
      }else{
      i += 2*(n-1);  
        n--;
     recursion(n);
   }
    recursion(12)
//阿米巴分裂繁殖。每分裂一次要用三分钟，放在一个容器内，45分钟之后充满了容器，已//知容器最多可以装220220个，问刚开始放了多少个阿米巴？
       var n = 15;
       var amount = 220220;
       function amiba(amount){
          var ami; 
         while(n >= 1){
            ami = amount/2;
            n--;
         }
         console.log(amount)
      }
     var amount = 220220;
     amiba(220220)

