"use client";


import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { timedisplay } from "@packages/backend/utilities/utility";
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';

export const TimeSpans = function TimeSpans({ spans, podcast_id, episode_id }:
    {
        spans: Array<Doc<"timespan">>,
        podcast_id: Id<"podcast">,
        episode_id: Id<"episode"> | undefined
    }): JSX.Element {
    const errorStyle = { color: 'red' }
    const [name, setName] = useState<string>()
    const [start, setStart] = useState<string>()
    const [end, setEnd] = useState<string>()
    const [errorStr, setError] = useState<string>()


    const addTimeSpan = useMutation(api.everwhz.addTimeSpan);
    const deleteTimeSpan = useMutation(api.everwhz.deleteTimeSpan);

    function add() {
        if (!start || !end || !name) {
            error("start, end and name must be set")
            return
        }
        if (name && name.length < 2) {
            error("name must be atleast 2 characters")
            return
        }
        if (!validDate(start) || !validDate(end)) {
            return
        }

        addTimeSpan({ podcast_id: podcast_id, episode_id: episode_id, name: name, start: start, end: end })

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
        if (!(dateString.length == 8 || (dateString[0] == '-' && dateString.length == 9))) {
            error("must be format YYYYMMDD or -YYYYMMDD")
            return false
        }
        if (Number.parseInt(dateString.slice(-2)) > 31 || Number.parseInt(dateString.slice(-4, -2)) > 12) {
            error("YYYYMMDD MM <= 12 DD <= 31")
            return false
        }
        return true
    }

    function error(error: string) {
        if (errorStr && errorStr.length > 0) {
            error = errorStr + "," + error
        }
        setError(error)
    }

    function deleteSpan(index: number) {
        setName(spans[index].name)
        setStart(spans[index].start)
        setEnd(spans[index].end)

        deleteTimeSpan({ id: spans[index]._id })
    }

    const spanDivs = spans.map((span, index) => {
        return <div key={spans[index]._id}><button className="navigation-button" onClick={() => deleteSpan(index)}>-</button>{timedisplay(span.start)} to {timedisplay(span.end)} {span.name}</div>
    })
    return <div>
        <button className="navigation-button" onClick={() => add()}>+</button>
        <input className="text-input" type="text" placeholder="YYYYMMDD start" onChange={e => {
            setStart(e.target.value)
        }} value={start} />
        <input className="text-input" type="text" placeholder="YYYYMMDD end" onChange={e => setEnd(e.target.value)} value={end} />
        <input className="text-input" type="text" placeholder="span name" onChange={e => setName(e.target.value)} value={name} />
        <div style={errorStyle}>{errorStr}</div>
        {spanDivs}
    </div>
}