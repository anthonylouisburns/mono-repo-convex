

export function timedisplay(dateString: string) {
    const y = dateString.slice(0, -4)
    const m = dateString.slice(-4, -2)
    const d = dateString.slice(-2)
    var dateString = y
    if(dateString.slice(0,1)=="-"){
        dateString = dateString.slice(1)+" BC"
    }
    if (m != "00") {
        dateString += "-" + m

        if (d != "00") {
            dateString += "-" + d
        }
    }
    return <>{dateString}</>
}