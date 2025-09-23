import { Image } from "react-bootstrap";
import "./CountryFlag.scss";

const CountryFlag = ({ countryCode, countryName, size = "16x12", className = "me-2" }) => {
  if (!countryCode) {
    return null;
  }

  const flagUrl = `https://flagcdn.com/${size}/${countryCode.toLowerCase()}.png`;

  return (
    <Image
      src={flagUrl}
      alt={`${countryName} flag`}
      className={`country-flag ${className}`}
      onError={(e) => {
        e.target.style.display = "none";
      }}
    />
  );
};

export default CountryFlag;
