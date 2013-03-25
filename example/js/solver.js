depman.use(['vendor.backbone'], function (Backbone) {
  console.log(Backbone);
  
  return {
    sum: function (a, b) {
      document.getElementById('solver').innerHTML = (a+b).toString();
    }
  };
}, 'solver');