//***********************dichotomy algorithm*******************************
   function dichotomy(arr,search_val){
     var low =0,high = arr.length -1;
   //  var mid;
   while(low <= high){
   var mid = Math.floor((low + high)/2)
   console.log(mid)
      if(arr[mid] == search_val){
//      console.log(arr[mid]);
       console.log('已找到')  
       return ;
      }else if(arr[mid] >= search_val){
           high  = mid -1;
  //  console.log(high)
   console.log(arr[mid]+ 'sss'+ search_val)
    console.log('往左边查找')
//      return ;
      }else{
       low = mid + 1;
     console.log('往右边查找')
  //    return ;  
     }
//    console.log('未找到！！！')
  //   return;
      }

  }
    var arr = [1,3,4,6,8,10];
    for(var i=0;i<arr.length;i++){
      dichotomy(arr,arr[i])
     }
