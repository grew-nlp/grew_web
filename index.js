Vue.config.devtools = true

var current = new Vue({
  el: '#app',
  data: {
    id: "Not connected",
    grs: 'No GRS loaded',
    strats: [],

    corpus: 'No corpus loaded',
    sent_ids: [],

    level: 0,

    normal_forms: [],

    enable_rules: false,
    rules: [],

    svg_init: "",
    svg_final: "",
    svg_before: "",
    svg_after: "",
  },
  methods: {}
})

$(document).ready(function() {
  connect();
});

// ====================================================================================================
function connect() {
  var form = new FormData();
  var settings = {
    "url": "http://localhost:8080/connect",
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
      current.id = resp.data;
    }
  })
  .fail(function () {
    swal("Connection fail", "The grew_back service is not available.", "error");
  });
}


// ====================================================================================================
function set_level(level) {
  current.level = level;

  if (level < 2) {
    $('#pill-corpus .nav-item').removeClass('selected');
    current.svg_init = "";
  }
  if (level < 4) {
    current.normal_forms = [];
    current.svg_final = "";
  }
  if (level < 5) {
    current.rules = [];
    current.svg_before = "";
    current.svg_after = "";
  }
}

// ====================================================================================================
$("#corpus_input").change(function(event) {
  const files = event.target.files;
  upload_corpus(files[0]);
})

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
      set_level(1);
      current.corpus = file.name;
      current.sent_ids = resp.data.sent_ids;
      if (resp.data.sent_ids.length == 1) {
        select_graph(resp.data.sent_ids[0])
      }
    }
  });
}

// ====================================================================================================
// Binding on grs_input
$("#grs_input").change(function(event) {
  const files = event.target.files;
  upload_grs(files[0]);
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
      current.strats = resp.data;
    }
  });
}

// ====================================================================================================
function select_graph_event(event) {
  const sent_id = event.target.id;
  select_graph(sent_id);
}

// ====================================================================================================
function select_graph(sent_id) {
  set_level(2);
  console.log("[select_graph] " + sent_id);

  $('#pill-corpus .nav-item').removeClass('selected');
  $("#" + sent_id).parent().addClass("selected");

  var form = new FormData();
  form.append("sent_id", sent_id);

  var settings = {
    "url": "http://localhost:8080/select_graph",
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
      current.svg_init = resp.data;
    }
  });
}

// ====================================================================================================
function rewrite(event) {
  if (current.level >= 2) {
    set_level(3);
    const strat = event.target.id.slice(6) // remove the prefix "strat-"
    console.log("[rewrite] " + strat);

    var form = new FormData();
    form.append("strat", strat);

    var settings = {
      "url": "http://localhost:8080/rewrite",
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
        alert("[ERROR in rewrite strat " + strat + "] " + resp.message);
      } else {
        current.normal_forms = [];
        console.log(resp);
        if (resp.data == 0) {
          alert("No graph produced");
        } else if (resp.data == 1) {
          current.normal_forms = ["G_0"];
          $("#button-rewriting").click();
          select_normal_form(0);
        } else {
          for (var i = 0; i < resp.data; i++) {
            current.normal_forms.push("G_" + i);
          }
          $("#button-rewriting").click();
        }
      }
    });
  }
}

// ====================================================================================================
function select_normal_form_event(event) {
  const position = event.target.id.slice(2);
  select_normal_form(position);
}

// ====================================================================================================
function select_normal_form(position) {
  console.log("[select_normal_form] " + position);
  set_level(4);

  $('#pill-rewriting .nav-item').removeClass('selected');
  $("#" + event.target.id).parent().addClass("selected");

  var form = new FormData();
  form.append("position", position);

  var settings = {
    "url": "http://localhost:8080/select_normal_form",
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
      alert("[ERROR in select_normal_form. position " + position + "] " + resp.message);
    } else {
      current.svg_final = resp.data;
    }
  });

}

// ====================================================================================================
function get_rules(event) {
  set_level(5);
  // current.enable_rules = true;
  var form = new FormData();

  var settings = {
    "url": "http://localhost:8080/rules",
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
      alert("[ERROR in rules] " + resp.message);
    } else {
      current.rules = resp.data;
      $("#button-rules").click();
      if (resp.data.length == 1) {
        select_rule(1);
      }
    }
  });
}

// ====================================================================================================
function select_rule_event(event) {
  const position = event.target.id.split("-")[0];
  select_rule(position)
}

// ====================================================================================================
function select_rule(position) {
  set_level(6);
  console.log("[select_rule] " + position);

  $('#pill-rules .nav-item').removeClass('selected');
  // jquery selector does not work because of the dot usage in rule names (stackoverflow.com/questions/605630)
  $(document.getElementById(event.target.id)).parent().addClass("selected");

  var form = new FormData();
  form.append("position", position);

  var settings = {
    "url": "http://localhost:8080/select_rule",
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
      alert("[ERROR in select_rule. position " + position + "] " + resp.message);
    } else {
      current.svg_before = resp.data.before;
      current.svg_after = resp.data.after;
    }
  });
}

syncScroll($('#svg_init'), $('#svg_final'));
syncScroll($('#svg_before'), $('#svg_after'));


/***
 *   Synchronize Scroll
 *   Synchronizes the horizontal scrolling of two elements.
 *   The elements can have different content widths.
 *
 *   @param $el1 {Object}
 *       Native DOM element or jQuery selector.
 *       First element to sync.
 *   @param $el2 {Object}
 *       Native DOM element or jQuery selector.
 *       Second element to sync.
 *
 *  adapted from https://stackoverflow.com/questions/18952623/synchronized-scrolling-using-jquery#answer-27007581
 *
 */
function syncScroll(el1, el2) {
  var $el1 = $(el1);
  var $el2 = $(el2);

  // Lets us know when a scroll is organic
  // or forced from the synced element.
  var forcedScroll = false;

  // Catch our elements' scroll events and
  // syncronize the related element.
  $el1.scroll(function() {
    performScroll($el1, $el2);
  });
  $el2.scroll(function() {
    performScroll($el2, $el1);
  });

  // Perform the scroll of the synced element
  // based on the scrolled element.
  function performScroll($scrolled, $toScroll) {
    if (forcedScroll) return (forcedScroll = false);
    var percent = ($scrolled.scrollLeft() / ($scrolled[0].scrollWidth - $scrolled.outerWidth())) * 100;
    setScrollLeftFromPercent($toScroll, percent);
  }

  // Scroll to a position in the given
  // element based on a percent.
  function setScrollLeftFromPercent($el, percent) {
    var scrollLeftPos = (percent / 100) * ($el[0].scrollWidth - $el.outerWidth());
    forcedScroll = true;
    $el.scrollLeft(scrollLeftPos);
  }
}