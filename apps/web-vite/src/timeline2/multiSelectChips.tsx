import { useState } from "react";
import { Autocomplete, TextField, Chip } from "@mui/material";

interface MultiSelectChipsProps {
  options: string[];
}

export default function MultiSelectChips({ options }: MultiSelectChipsProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  return (
    <Autocomplete
      multiple
      options={options}
      value={selectedValues}
      onChange={(_, newValue) => setSelectedValues(newValue)}
      freeSolo // Allows users to add custom values
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip label={option} {...getTagProps({ index })} />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label="Select Technologies"
          placeholder="Type..."
        />
      )}
    />
  );
}
