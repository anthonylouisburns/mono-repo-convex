"use client";

import { Button } from "@/components/common/button";
import { useRef, createRef, Component, useState } from 'react';

export const TimeSpans = function TimeSpans({ spans, addSpan, deleteSpan }: {
    spans: Array<{ name: string, start: string, end: string }>,
    addSpan: (span: { name: string, start: string, end: string }) => void,
    deleteSpan: (index: number) => void
}): JSX.Element {
    const errorStyle = { color: 'red' }
    const [name, setName] = useState<string>()
    const [start, setStart] = useState<string>()
    const [end, setEnd] = useState<string>()
    const [errorStr, setError] = useState<string>()

    function add() {
        if(!start || !end || !name){
            error("start, end and name must be set")
            return
        }
        if (name && name.length < 2) {
            error("name must be atleast 2 characters")
            return
        }
        if(!validDate(start) || !validDate(end)){
            return
        }

        addSpan({ name: name, start: start, end: end })

        setName('')
        setStart('')
        setEnd('')
        setError('')
    }

    function validDate(dateString: string) {
        if (Number.isNaN(dateString)) {
            error('String must be numeric')
            return false
        }
        if (!(dateString.length == 8 || (dateString[0]=='-' && dateString.length == 9))) {
            error("must be format YYYYMMDD or -YYYYMMDD")
            return false
        }
        if (Number.parseInt(dateString.slice(-2)) > 31 || Number.parseInt(dateString.slice(-4, 2)) > 12) {
            error("YYYYMMDD MM <= 12 DD <= 31")
            return false
        }
        return true
    }

    function error(error: string) {
        if(errorStr && errorStr.length>0){
            error=errorStr+","+error
        }
        setError(error)
    }

    function deleteTimeSpan(index: number) {
        setName(spans[index].name)
        setStart(spans[index].start)
        setEnd(spans[index].end)

        deleteSpan(index)
    }

    const spanDivs = spans.map((span, index) => {
        return <div><Button onClick={() => deleteTimeSpan(index)}>-</Button>{span.start}-{span.end} {span.name}</div>
    })
    return <div>
        <Button onClick={() => add()}>+</Button>
        <input type="text" placeholder="YYYYMMDD start" onChange={e=>setStart(e.target.value)} value={start}/>
        <input type="text" placeholder="YYYYMMDD end" onChange={e=>setEnd(e.target.value)} value={end}/>
        <input type="text" placeholder="span name" onChange={e=>setName(e.target.value)} value={name}/>
        <div style={errorStyle}>{errorStr}</div>
        {spanDivs}
    </div>
}