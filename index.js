Vue.config.devtools = true

var current = new Vue({
  el: '#app',
  data: {
    corpus: 'No corpus loaded',
    grs: 'No GRS loaded',
    sent_ids: [],
    image: ""
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
    resp = JSON.parse(response);
    if (resp.status === "ERROR") {
      alert("[ERROR in change_graph. sent_id " + sent_id + "] " + resp.message);
    } else {
      current.image = resp.data;
    }
  });
}

function upload_corpus(file) {
  var form = new FormData();
  form.append("file", corpus_input.files[0], file);

  var settings = {
    "url": "http://localhost:8080/upload_corpus",
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
      current.corpus = file.name;
      current.sent_ids = resp.data.sent_ids;
    }
  });
}

// Binding on corpus_input
$("#corpus_input").change(function(event) {
  const files = event.target.files;
  upload_corpus(files[0]);
})


function upload_grs(file) {
  var form = new FormData();
  form.append("file", grs_input.files[0], file);

  var settings = {
    "url": "http://localhost:8080/upload_grs",
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
      alert("[ERROR, file " + file.name + "] " + resp.message);
    } else {
      current.grs = file.name;
    }
  });
}

// Binding on grs_input
$("#grs_input").change(function(event) {
  const files = event.target.files;
  upload_grs(files[0]);
})