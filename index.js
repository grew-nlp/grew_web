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
  console.log("change_graph: " + sent_id);

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



function uploadFile(file) {
  console.log("Uploading file...");
  const API_ENDPOINT = "http://localhost:8080/upload";
  const request = new XMLHttpRequest();
  const formData = new FormData();

  request.open("POST", API_ENDPOINT, true);
  request.onreadystatechange = () => {
    if (request.readyState === 4) {
      if (request.status === 200) {
        resp = JSON.parse(request.responseText);
        if (resp.status === "ERROR") {
          alert("[ERROR, file " + file.name + "] " + resp.message.message);
        } else {
          console.log(request.responseText);
          current.sent_ids = resp.data.sent_ids;
        }
      } else {
        console.log(file);
        alert("[ERROR] cannot load: " + file.name);
      }
    } else {
      console.log("still waiting");
    }
  };
  formData.append("file", file);
  request.send(formData);
}

// Binding on fileInput
$("#fileInput").change(function(event) {
  const files = event.target.files;
  uploadFile(files[0]);
})