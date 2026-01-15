/* Author:
*/

var matrix = [];

function odds(matrix, game) {
  var numerator = 0;

  if ( game === 'Ship, Captain, Crew' ) {
    $.each( matrix, function(index, roll) {
      if( ($.inArray( 1, roll ) >= 0 &&
           $.inArray( 2, roll ) >= 0 &&
           $.inArray( 3, roll ) >= 0)
          ||
          ($.inArray( 4, roll ) >= 0 &&
           $.inArray( 5, roll ) >= 0 &&
           $.inArray( 6, roll ) >= 0)) {
        numerator++;
      }
    });
  } else if ( game === 'Monterey' ) {
    $.each( matrix, function(index, roll) {
      if( ($.inArray( 2, roll ) >= 0 &&
           $.inArray( 3, roll ) >= 0 &&
           $.inArray( 4, roll ) >= 0)
          ||
          ($.inArray( 3, roll ) >= 0 &&
           $.inArray( 4, roll ) >= 0 &&
           $.inArray( 5, roll ) >= 0)) {
        numerator++;
      }
    });
  } else if ( game === 'Pairs' ) {
    $.each( matrix, function(index, roll) {
      roll.sort();
      var match = 0,
        i = 0;
      while( i<roll.length-1 ) {
        if( roll[i] == roll[i+1] ) {
          match++;
          i = i + 2; //skip
        } else {
          i++;
        }
      }
      if( match > 1 ) {
        numerator++;
      }
    });
  } else if ( game === 'Vegas' ) {
    $.each( matrix, function(index, roll) {
      if(
             // 5, 2, 4, 3
          ($.inArray( 2, roll ) >= 0 &&
           $.inArray( 5, roll ) >= 0 &&
           $.inArray( 4, roll ) >= 0 &&
           $.inArray( 3, roll ) >= 0 ) ||
             // 6, 1, 5, 2
          ($.inArray( 2, roll ) >= 0 &&
           $.inArray( 5, roll ) >= 0 &&
           $.inArray( 6, roll ) >= 0 &&
           $.inArray( 1, roll ) >= 0 ) ||
             // 6, 1, 4, 3
          ($.inArray( 3, roll ) >= 0 &&
           $.inArray( 4, roll ) >= 0 &&
           $.inArray( 6, roll ) >= 0 &&
           $.inArray( 1, roll ) >= 0 ) ||
            // 6, 5, 4, 3
          ($.inArray( 3, roll ) >= 0 &&
           $.inArray( 4, roll ) >= 0 &&
           $.inArray( 6, roll ) >= 0 &&
           $.inArray( 5, roll ) >= 0 ) ||
             // 6, 5, 6, 1
          ($.inArray( 5, roll ) >= 0 &&
           $.inArray( 1, roll ) >= 0 &&
           roll.lastIndexOf(6) > roll.indexOf(6) ) ||
             // 6, 5, 5, 2
          ($.inArray( 6, roll ) >= 0 &&
           $.inArray( 2, roll ) >= 0 &&
           roll.lastIndexOf(5) > roll.indexOf(5) ) ||
             // 6, 5, 6, 5
          (roll.lastIndexOf(6) > roll.indexOf(6) &&
           roll.lastIndexOf(5) > roll.indexOf(5) ) ||
             // 5, 2, 5, 2
          (roll.lastIndexOf(2) > roll.indexOf(2) &&
           roll.lastIndexOf(5) > roll.indexOf(5) ) ||
             // 6, 1, 6, 1
          (roll.lastIndexOf(6) > roll.indexOf(6) &&
           roll.lastIndexOf(1) > roll.indexOf(1) ) ||
             // 4, 3, 4, 3
          (roll.lastIndexOf(4) > roll.indexOf(4) &&
           roll.lastIndexOf(3) > roll.indexOf(3) )
        ) {
        numerator++;
      }
    });
  } else if ( game === '10-2' ) {
    $.each( matrix, function(index, roll) {
      if( ($.inArray( 6, roll ) >= 0 &&
           $.inArray( 4, roll ) >= 0 ) ||
          (roll.lastIndexOf(5) > roll.indexOf(5) ) ) {
        numerator++;
      }
    });
  } else if ( game === '10-3' ) {
    $.each( matrix, function(index, roll) {
      if(
          ($.inArray( 6, roll ) >= 0 &&
           $.inArray( 3, roll ) >= 0 &&
           $.inArray( 1, roll ) >= 0 ) ||
          ($.inArray( 5, roll ) >= 0 &&
           $.inArray( 4, roll ) >= 0 &&
           $.inArray( 1, roll ) >= 0 ) ||
          (roll.lastIndexOf(2) > roll.indexOf(2) &&
           $.inArray( 6, roll ) >= 0 ) ||
          (roll.lastIndexOf(3) > roll.indexOf(3) &&
           $.inArray( 4, roll ) >= 0 ) ||
          (roll.lastIndexOf(4) > roll.indexOf(4) &&
           $.inArray( 2, roll ) >= 0 )
        ) {
        numerator++;
      }
    });
  } else if ( game === '10-4' ) {
    $.each( matrix, function(index, roll) {
      roll.sort();
      if(
          ($.inArray( 4, roll ) >= 0 &&
           $.inArray( 3, roll ) >= 0 &&
           $.inArray( 2, roll ) >= 0 &&
           $.inArray( 1, roll ) >= 0 ) ||
          (roll.lastIndexOf(3) > roll.indexOf(3) &&
           roll.lastIndexOf(3) > roll.indexOf(3, roll.indexOf(3)+1) &&
           $.inArray( 1, roll ) >= 0 ) ||
          (roll.lastIndexOf(2) > roll.indexOf(2) &&
           roll.lastIndexOf(2) > roll.indexOf(2, roll.indexOf(2)+1) &&
           $.inArray( 4, roll ) >= 0 ) ||
          (roll.lastIndexOf(2) > roll.indexOf(2) &&
           roll.lastIndexOf(3) > roll.indexOf(3)) ||
          (roll.lastIndexOf(1) > roll.indexOf(1) &&
           roll.lastIndexOf(4) > roll.indexOf(4)) ||
          (roll.lastIndexOf(2) > roll.indexOf(2) &&
           $.inArray( 1, roll ) >= 0 &&
           $.inArray( 5, roll ) >= 0 ) ||
          (roll.lastIndexOf(1) > roll.indexOf(1) &&
           $.inArray( 3, roll ) >= 0 &&
           $.inArray( 5, roll ) >= 0 ) ||
          (roll.lastIndexOf(1) > roll.indexOf(1) &&
           $.inArray( 2, roll ) >= 0 &&
           $.inArray( 6, roll ) >= 0 )
        ) {
        numerator++;
      }
    });
  }
  console.log(game + ": " + numerator + "\n");
  return Math.round((numerator/matrix.length)*10000)/100 + "%";
}


$(function() {
  $('#roll').on('click', function() {
    for (var i = 0; i < 5; i++) {
      console.log( Math.round(Math.random() * 6) % 6 + 1 );
    }
  });


  if( Modernizr.localstorage && !localStorage.getItem('matrix') === null ) {
    matrix = JSON.parse( localStorage.getItem('matrix') );
  }

  if( !matrix.length ) {
    // Generate dice roll matrix
    var count = 0;
    for (var i = 0; i < 6; i++ ) {
      for (var j = 0; j < 6; j++) {
        for (var k = 0; k < 6; k++) {
          for (var l = 0; l < 6; l++) {
            for (var m = 0; m < 6; m++) {
              matrix[count] = [i+1,j+1,k+1,l+1,m+1];
              count++;
            }
          }
        }
      }
    }

    if( Modernizr.localstorage ) {
      localStorage.setItem( 'matrix', JSON.stringify(matrix) );
    }
  }

  // $('tr[game="10-2"] td').first().text(odds( matrix, '10-2' ));
  // $('tr[game="10-3"] td').first().text(odds( matrix, '10-3' ));
  // $('tr[game="10-4"] td').first().text(odds( matrix, '10-4' ));
  // $('tr[game="Ship, Captain, Crew"] td').first().text(odds( matrix, 'Ship, Captain, Crew' ));
  // $('tr[game="Monterey"] td').first().text(odds( matrix, 'Monterey' ));
  // $('tr[game="Vegas"] td').first().text(odds( matrix, 'Vegas' ));
  // $('tr[game="Pairs"] td').first().text(odds( matrix, 'Pairs' ));
  // $('tr[game="Razzle"] td').first().text(odds( matrix, 'Razzle' ));
  // $('tr[game="Boss"] td').first().text(odds( matrix, 'Boss' ));
  // $('tr[game="Tres Away"] td').first().text(odds( matrix, 'Tres Away' ));
});
