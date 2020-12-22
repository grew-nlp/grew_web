Vue.config.devtools = true

var current = new Vue({
  el: '#app',
  data: {
    grew_back_url: "http://back.grew.fr/",

    session_id: "Not connected",
    grs: 'No GRS loaded',
    strats: [],

    corpus: 'No corpus loaded',
    sent_ids: [],

    level: 0,
    selected_graph: "",
    selected_strat: "",
    nb_rules: 0,

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

// ====================================================================================================
$(document).ready(function() {
  init();
  connect();
});

// ====================================================================================================
function init() {
  if (window.location.origin.includes("localhost")) {
    current.grew_back_url = "http://localhost:8080/"
    $('.navbar').css({
      'background': 'orange'
    });
  }
}

// ====================================================================================================
function request(service, form, data_fct) {
  var settings = {
    "url": current.grew_back_url + service,
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function(response) {
      // console.log(response);
      resp = JSON.parse(response);
      if (resp.status === "ERROR") {
        swal(service, resp.message.message, "error");
      } else {
        data_fct(resp.data);
      }
    })
    .fail(function() {
      swal("Connection fail", "The grew_back service is not available.", "error");
    });
}

// ====================================================================================================
function connect() {
  var form = new FormData();
  request("connect", form, function(data) {
    current.session_id = data;
    parameters(); // make sure that parameters are handled after connection with the server
  })
}

// ====================================================================================================
function parameters() {
  let searchParams = new URLSearchParams(window.location.search)
  if (searchParams.has('grs')) {
    url_grs(searchParams.get('grs'));
  }
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
    current.selected_strat = "";
  }
  if (level < 5) {
    current.rules = [];
    current.svg_before = "";
    current.svg_after = "";
  }
}


// ====================================================================================================
$('#dep_graph').change(function() {
  var form = new FormData();
  form.append("session_id", current.session_id);
  if ($(this).prop('checked')) {
    form.append("display", "dep");
  } else {
    form.append("display", "graph");
  }

  request("set_display", form, function(data) {
    if ("init" in data) {
      current.svg_init = data.init;
    }
    if ("final" in data) {
      current.svg_final = data.final;
    }
    if ("before" in data) {
      current.svg_before = data.before;
    }
    if ("after" in data) {
      current.svg_after = data.after;
    }
  })
})

// ====================================================================================================
$("#corpus_input").change(function(event) {
  const files = event.target.files;
  upload_corpus(files[0]);
  // next line: trick to deal with reloading of the same file
  $("#corpus_input").val('');
})

// ====================================================================================================
function upload_corpus(file) {
  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("file", file);

  request("upload_corpus", form, function(data) {
    set_level(1);
    current.corpus = file.name;
    current.sent_ids = resp.data.sent_ids;
    if (resp.data.sent_ids.length == 1) {
      select_graph(resp.data.sent_ids[0])
    }
  })
}

// ====================================================================================================
function url_grs(url) {
  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("url", url);

  request("url_grs", form, function(data) {
    current.grs = "From URL";
    current.strats = data;

  })
}

// ====================================================================================================
// Binding on grs_input
$("#grs_input").change(function(event) {
  const files = event.target.files;
  upload_grs(files[0]);
  // next line: trick to deal with reloading of the same file
  $("#grs_input").val('');
})

// ====================================================================================================
function upload_grs(file) {
  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("file", file);

  request("upload_grs", form, function(data) {
    current.grs = file.name;
    current.strats = data;
  })
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
  form.append("session_id", current.session_id);
  form.append("sent_id", sent_id);

  request("select_graph", form, function(data) {
    current.selected_graph = sent_id;
    current.svg_init = data;
  })
}

// ====================================================================================================
function rewrite(event) {
  set_level(3);
  const strat = event.target.id.slice(6) // remove the prefix "strat-"
  console.log("[rewrite] " + strat);

  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("strat", strat);

  request("rewrite", form, function(data) {
    current.normal_forms = [];
    if (data == []) {
      swal("rewrite", "No graph produced", "info");
      set_level(2);
    } else {
      current.normal_forms = data
      current.selected_strat = strat;
      $("#button-rewriting").click(); // change pane
    }
    // if there is exactly one normal_form, select it
    if (data.length == 1) {
      select_normal_form(0);
    }
  })
}

// ====================================================================================================
function select_normal_form_event(event) {
  const position = event.target.id.slice(2); // remove prefix "G_"
  select_normal_form(position);
}

// ====================================================================================================
function select_normal_form(position) {
  console.log("[select_normal_form] " + position);
  set_level(4);

  current.nb_rules = current.normal_forms[position];

  $('#pill-rewriting .nav-item').removeClass('selected');
  $("#" + event.target.id).parent().addClass("selected");

  var form = new FormData();
  form.append("session_id", current.session_id);
  form.append("position", position);

  request("select_normal_form", form, function(data) {
    current.svg_final = data;
  })
}

// ====================================================================================================
function get_rules(event) {
  set_level(5);
  // current.enable_rules = true;
  var form = new FormData();
  form.append("session_id", current.session_id);

  request("rules", form, function(data) {
    current.rules = data;
    $("#button-rules").click();
    if (data.length == 1) {
      select_rule(1);
    }
  })
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
  form.append("session_id", current.session_id);
  form.append("position", position);

  request("select_rule", form, function(data) {
    current.svg_before = data.before;
    current.svg_after = data.after;
  })
}

// ====================================================================================================
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