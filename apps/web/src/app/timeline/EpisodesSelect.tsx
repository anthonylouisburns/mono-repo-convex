"use client";

import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { Options } from "distinct-colors"
import distinctColors from "distinct-colors"
import { api } from '@packages/backend/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Select from 'react-select'

export const FIRST_ELEMENT = { label: "-", value: null, key: "-" }

export const EpisodeSelect = function EpisodeSelect({ podcast_id, selectedOption, setSelectedOption, setSelectedEpisode }:
    {
        podcast_id: Id<"podcast"> | null,
        selectedOption: { label: string, value: string | null, key: string | null } | null,
        setSelectedOption: Dispatch<SetStateAction<{ label: string, value: string | null, key: string | null } | null>>,
        setSelectedEpisode: Dispatch<SetStateAction<Id<"episode"> | null>>
    }): JSX.Element {
    const episodes = useQuery(api.everwhz.episodes, { podcast_id: (podcast_id) });


    var optionList: Array<{ label: string, value: string | null, key: string | null }> = episodes ? episodes?.map((episode) => {
        return { label: (episode.body.title as string), value: (episode._id), key: (episode._id), }
    }) : []

    // [ ] allow no episode
    optionList.unshift(FIRST_ELEMENT)

    return <Select
        className="text-input"
        options={optionList}
        onChange={(e) => {
            if (e) {
                setSelectedEpisode(e?.value as Id<"episode">)
                setSelectedOption(e)
            }
        }}
        value={selectedOption}
        formatOptionLabel={function (data) {
            return (
                <span dangerouslySetInnerHTML={{ __html: data.label }} />
            );
        }} />
}

