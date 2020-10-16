var current = new Vue({
  el: '#app',
  data: {
    corpus: 'No corpus loaded',
    sent_ids: []
  },
  methods: {
    select_graph: function(event) {
      console.log("[select_graph] " + event.target.id);
      change_graph(event.target.id);
    }
  }
})

function change_graph(sent_id) {
  var form = new FormData();
  form.append("sent_id", sent_id);

  var settings = {
    "url": "http://localhost:8080/save_pict",
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings).done(function(response) {
    console.log(response);
  });
}

function upload_file(file) {
  var form = new FormData();
  form.append("file", fileInput.files[0], file);

  var settings = {
    "url": "http://localhost:8080/upload",
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings).done(function(response) {
    console.log(response);
    resp = JSON.parse(response);
    if (resp.status === "ERROR") {
      alert("[ERROR, file " + file.name + "] " + resp.message.message);
    } else {
      current.sent_ids = resp.data.sent_ids;
    }
  });
}






// Binding on fileInput
$("#fileInput").change(function(event) {
  const files = event.target.files;
  upload_file(files[0]);
})