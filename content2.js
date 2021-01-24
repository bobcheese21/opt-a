$.get(chrome.runtime.getURL('/popup.html'), function (data) {
  $(data).appendTo('body');
});
