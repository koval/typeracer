CONFIG = {
  nick: null,
  race: null,
  typed: 0,
  total: null,
  step: null,
}

function showStartPage() {
  $('#races').load('/races', function() {
    $('.join').click(joinRace);
  });

  $("#startscreen").overlay({ 
      top: 'center',
      expose: { 
          color: '#fff', 
          loadSpeed: 200, 
          opacity: 1, 
      }, 
      closeOnClick: false, 
      api: true 
  }).load();
}

var poll;

function joinRace(e) {
  var id = $(this).attr('id');
  $.get('/join?race='+id, function (data) {
    CONFIG.nick = data.nick;
    CONFIG.race = data.race;
    addCars(data.race_info);
    startRace();
    var poll = setInterval(function (e) {
      $.get('/status', CONFIG, function (d) {
        updateCars(d);
      }, 'json');
    }, 1000)
  }, 'json');
  $('#startscreen').overlay().close();
}

function addCars(race_info) {
  var div = $('#cars');
  var i = 0;
  for (var id in race_info) {
    if (!race_info.hasOwnProperty(id)) continue;
    i += 1;
    if ($('#'+id).length !== 0) {
      continue;
    }
    var class = 'car' + (i%4+1);
    div.append('<p><a href="#" class="'+class+'" id="'+id+'></a></p>');
  }
}

var started;

function startRace() {
  if (started) return;
  started = true;
  $('#start').addClass('active');
  $('#start').text('Countdown');
  $('#timer').show();
  var timetogo = 5;
  var timer = window.setInterval(function() {
      if (timetogo >= 10) {
          $('#timer').text('0:'+timetogo);
      } else {
          $('#timer').text('0:0'+timetogo);
      }
      if (timetogo <= 0)
      { 
          $('#timer').hide();
          window.clearInterval(timer);
          // set focus on input field and clear it
          $('input').val('');
          $('input').removeAttr('disabled');
          $('input').focus();
          started = new Date();
          $('#start').text('Racing');
      }
      timetogo--;
  }, 1000);
}

function finishRace() {
  $('input').val('');
  $('input').attr('disabled', 'disabled');
  var duration = new Date();
  duration = (duration - started)/1000;
  $('#text').text('Finished in '+duration+' seconds!!!');
  $('#start').removeClass('active').text('Start a new race');
}

function checkConcurents(race_info) {
  if (started) return false;
  var can_start = false;
  for (var id in race_info) {
    if (!race_info.hasOwnProperty(id)) continue;
    if (id !== CONFIG.nick) {
      can_start = true;
      if ($('#'+id).length === 0) {
        addCars(race_info);
      }
    }
  }
  return can_start;
}

function updateCars(race_info) {
  for (var id in race_info) {
    if (!race_info.hasOwnProperty(id)) continue;
    if (id !== CONFIG.nick) {
      var car = $('#' + id);
      var step = race_info[id].step;
      if (car.position().left !== step*race_info[id].typed) {
        var np = step*race_info[id].typed;
        car.animate({left: np}, 1000)
      }
    }
  }
}

$(document).ready(function () {

  // start page
  showStartPage();

  $('#create').click(function (e) {
    $.get("/create", function (data) {
      CONFIG.nick = data.nick;
      CONFIG.race = data.race;
      addCars(data.race_info);
      var poll = setInterval(function (e) {
        $.get('/status', CONFIG, function (d) {
          if (checkConcurents(d)) {
            startRace();
          }
          updateCars(d);
        }, 'json');
      }, 1000)
    }, 'json');
    $('#startscreen').overlay().close();
  });

    //Animates pressed key's block
    function animateLetter(letter) {
        $(".key-" + letter).stop(true,false)
            .animate({opacity: 1.0}, 300)
            .animate({opacity: 0.2}, 600);
    }

    // get the text from #text div
    var text_container = $('#text');
    var raw_words = text_container.text().split(' ');
    text_container.text('');
    // filter new-lines and empty strings
    var words = [];
    for (var i=0; i<raw_words.length; i++) {
        word = raw_words[i];
        word = word.replace('\n', '');
        if (word && word !== '\n') {
            words.push(word);
        }
    }
    // wrap every word in <span>
    for (var i=0; i<words.length; i++) {
        var word = words[i];
        if (word && word !== '\n') {
            if (i === words.length-1) {
                // last word, don't add a trailing space
                var span = $('<span>').text(word)[0];
            } else {
                var span = $('<span>').text(word+' ')[0];
            }
            text_container.append(span);
        }
    }

    // initialize needed vars and highlite the first word
    var index = 0;
    var words = $('#text span');
    var max_position = 735;
    var step = max_position/words.length;
    var current_word = $(words[index]);
    var word = current_word.text();
    var typed = '';
    current_word.css({color: 'green', 'text-decoration': 'underline'});

    CONFIG.typed = index;
    CONFIG.total = words.length;
    CONFIG.step = step;

    // disable form submit
    $('form').submit(function (e) {
        return false;
    })

    // process input
    $("input").keypress(function (e) {
        if (e.which !== 8) {
            // soome non-printable key combination
            if (e.metaKey || e.charCode === 0) {
                return;
            }

            var c = String.fromCharCode(e.which);
            typed += c;
            // alert as fast as can
            if (c !== word[typed.length-1]) {
                current_word.css({color: 'red'});
            }
            else {
                current_word.css({color: 'green'});
            }

            // space character marks end of the word
            if ((c === ' ') || ((index === words.length-1) && (typed.length === word.length))) {
                // check typed word
                if (typed !== word) {
                    current_word.css({color: 'red'})
                }
                else {
                    current_word.css({color: null, 'text-decoration': 'none'});
                    index += 1;
                    CONFIG.typed = index;
                    if (index >= words.length) {
                        // finished - clear and disable input field
                        $('#' + CONFIG.nick).animate({left: '+='+step}, 1000)
                        finishRace();
                    } else {
                        current_word = $(words[index]);
                        word = current_word.text();
                        typed = '';
                        current_word.css({color: 'green', 'text-decoration': 'underline'});
                        // clear input field
                        $('input').val('');
                        // and move the car
                        $('#' + CONFIG.nick).animate({left: '+='+step}, 1000)
                    }
                }
                c = 'space'; // class for space key to highlight it
            }
            animateLetter(c);
        } else if (e.which === 8) {
            // remove last character from a buffer of typed characters when 
            // the backspace key was pressed
            typed = typed.substr(0, typed.length-1);
        }
    });
// google chrome fires only keyup event for backspace
//     $("input").keyup(function (e) {
//         if (e.keyCode === 8) {
//             // remove last character from a buffer of typed characters when 
//             // the backspace key was pressed
//             typed = typed.substr(0, typed.length-1);
//         }
//     });

    // show/hide keyboard toggle
    $('#show').css({display: 'none'})

    $(".keyboard_toggle a").click(function (e) {
        $('#keyboard').slideToggle();
        $(this).css({display: 'none'})
        if ($(this).attr('id') == 'show') {
            $('#hide').css({display: 'inline-block'});
        } else if ($(this).attr('id') == 'hide') {
            $('#show').css({display: 'inline-block'});
        }
        return false;
    });

    // start race on click
    $('#start').click(function (e) {
      window.location = '/';
    });

});
