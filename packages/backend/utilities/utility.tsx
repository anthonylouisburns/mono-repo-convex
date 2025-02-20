export function timedisplay(dString: string) {
  const y = dString.slice(0, -4);
  const m = dString.slice(-4, -2);
  const d = dString.slice(-2);

  var dateString = y;
  var era = "";

  if (dateString.slice(0, 1) == "-") {
    era = " BC";
    dateString = dateString.slice(1);
  } else {
    if (dateString.slice(0, 2) != "19" && dateString.slice(0, 2) != "20") {
      era = " AD";
    }
  }

  if (dateString.slice(0, 1) == "0") {
    dateString = dateString.slice(1);
    if (dateString.slice(0, 1) == "0") {
      dateString = dateString.slice(1);
      if (dateString.slice(0, 1) == "0") {
        dateString = dateString.slice(1);
      }
    }
  }

  if (m != "00") {
    dateString += "-" + m;

    if (d != "00") {
      dateString += "-" + d;
    }
  }

  dateString += era;
  return <>{dateString}</>;
}
