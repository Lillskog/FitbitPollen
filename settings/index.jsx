function PollenSettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Demo Settings</Text>}>
        <TextInput
          label="API key"
          placeholder = "API key from Breezometer"
          settingsKey="apikey"
        />
        <Toggle
          settingsKey="toggle"
          label="Update GPS position"
        />
        <TextInput
          label="Latitude"
          placeholder="57.708870 (Decimal form)"
          settingsKey="latitude"
          disabled={!(props.settings.toggle === "false")}
        />
        <TextInput
          label="Longitude"
          placeholder="11.974560 (Decimal form)"
          settingsKey="longitude"
          disabled={!(props.settings.toggle === "false")}
        />
        <Select
          label={`Pollen filter`}
          multiple
          settingsKey="multiselection"
          options={[
            {name:"Alder",   value:"1"},
            {name:"Ash",   value:"2"},
            {name:"Birch", value:"3"},
            {name:"Cottonwood", value:"4"},
            {name:"Elm", value:"5"},
            {name:"Maple", value:"6"},
            {name:"Olive", value:"7"},
            {name:"Juniper", value:"8"},
            {name:"Cedar/Cypress", value:"9"},
            {name:"Oak", value:"10"},
            {name:"Graminales", value:"11"},
            {name:"Ragweed", value:"12"},
            {name:"Pine", value:"13"},
          ]}
          renderItem={
            (option) =>
              <TextImageRow
                label={option.name}
              />
          }
          //onSelection={(selection) => console.log(selection)}
          onSelection={(selection) => props.settingsStorage.setItem(`${selection.name}`, `${selection.value}`)}
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(PollenSettings);
