import { useState } from "react";
import { Dropdown } from "react-bootstrap";
import CountryFlag from "../CountryFlag/CountryFlag";
import "./UniversalDropdown.scss";

const UniversalDropdown = ({
  options = [],
  countries = [],
  value,
  onChange,
  placeholder = "Select option",
  size = "sm",
  showAllCountries = false,
  showSearch = true,
  type = "generic"
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const items = type === "countries" ? countries : options;
  const selectedItem = type === "countries" ? countries.find((c) => c.id.toString() === value?.toString()) : options.find((opt) => opt.value === value);

  const filteredItems = items.filter((item) => {
    const searchText = type === "countries" ? item.name : item.label;
    return searchText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (selectedValue) => {
    const value = selectedValue === "" ? null : selectedValue;
    onChange({ target: { value } });
    setSearchTerm("");
  };

  const hasSelection = value && value !== "";

  return (
    <Dropdown className="universal-dropdown w-100">
      <Dropdown.Toggle
        variant="outline-secondary"
        size={size}
        className={`universal-dropdown__toggle w-100 d-flex align-items-center justify-content-between ${hasSelection ? "has-selection" : ""}`}
      >
        {selectedItem && hasSelection ? (
          type === "countries" ? (
            <div className="d-flex align-items-center gap-2">
              <CountryFlag countryCode={selectedItem.countryCode} countryName={selectedItem.name} size="16x12" />
              <span>{selectedItem.name}</span>
            </div>
          ) : (
            <span>{selectedItem.label}</span>
          )
        ) : (
          <span className="text-muted placeholder-text">{placeholder}</span>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="w-100 universal-dropdown__menu">
        {showSearch && (
          <div className="universal-dropdown__search">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        <div className="universal-dropdown__content">
          {type === "countries" && showAllCountries && (
            <Dropdown.Item onClick={() => handleSelect("")}>
              <span>🌍</span> All Countries
            </Dropdown.Item>
          )}

          {filteredItems.map((item) => (
            <Dropdown.Item key={item.id || item.value} onClick={() => handleSelect(item.id || item.value)} className="d-flex align-items-center gap-2">
              {type === "countries" ? (
                <>
                  <CountryFlag countryCode={item.countryCode} countryName={item.name} size="16x12" />
                  {item.name}
                </>
              ) : (
                item.label
              )}
            </Dropdown.Item>
          ))}

          {filteredItems.length === 0 && <Dropdown.Item disabled>No options found</Dropdown.Item>}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default UniversalDropdown;
