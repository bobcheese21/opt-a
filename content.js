$("#datas").empty()
$("#header").html(data.shift())
data.map(elem => {
  $("#datas").append("<li style='position: relative; font-style: align-text: left; italic; margin-top: 5px; left: 20px'> " +elem + "</li>")
})

var elem = $("#11235813ANUS");

// $.get(chrome.runtime.getURL('/popup.html'), function (data) {
//   $(data).appendTo('body');
// });
// console.log(scriptOptions.value)
elem.animate({
  "left": "2%",
}, 300, "swing")
elem.delay(3000)
elem.animate({
  "left": "-100%",
}, 500, "swing")
console.log("done") 

