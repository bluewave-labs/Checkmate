import "flag-icons/css/flag-icons.min.css";
import { Select } from "@/components/inputs";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useAppDispatch, useAppSelector } from "@/hooks/AppHooks";
import { setLanguage } from "@/features/uiSlice";

export const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const language = useAppSelector((state: any) => state.ui.language);
  const languages = Object.keys(i18n.options.resources || {});
  const languageMap: Record<string, string> = {
    cs: "cz",
    ja: "jp",
    uk: "ua",
    vi: "vn",
  };

  const handleChange = (event: any) => {
    const newLang = event.target.value;
    dispatch(setLanguage(newLang));
  };

  const languagesForDisplay = languages.map((l) => {
    let formattedLanguage = l === "en" ? "gb" : l;
    formattedLanguage = formattedLanguage.includes("-")
      ? formattedLanguage.split("-")[1].toLowerCase()
      : formattedLanguage;
    formattedLanguage = languageMap[formattedLanguage] || formattedLanguage;
    const flag = formattedLanguage ? `fi fi-${formattedLanguage}` : null;

    return (
      <MenuItem key={l} value={l}>
        <Stack direction="row" gap={theme.spacing(4)}>
          {flag && <span className={flag} />}
          <Typography textTransform={"uppercase"}>{l}</Typography>
        </Stack>
      </MenuItem>
    );
  });

  return (
    <Select value={language} onChange={handleChange}>
      {languagesForDisplay}
    </Select>
  );
};
