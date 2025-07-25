import {
  LocalizationProvider
} from "./chunk-NWJ254HI.js";
import {
  require_jsx_runtime
} from "./chunk-WNFJDF7F.js";
import {
  require_react
} from "./chunk-6GAV2S6I.js";
import {
  __toESM
} from "./chunk-DC5AMYBS.js";

// node_modules/@mui/x-date-pickers/esm/hooks/useIsValidValue.js
var React = __toESM(require_react(), 1);
var IsValidValueContext = React.createContext(() => true);
if (true) IsValidValueContext.displayName = "IsValidValueContext";
function useIsValidValue() {
  return React.useContext(IsValidValueContext);
}

// node_modules/@mui/x-date-pickers/esm/hooks/usePickerContext.js
var React2 = __toESM(require_react(), 1);
var PickerContext = React2.createContext(null);
if (true) PickerContext.displayName = "PickerContext";
var usePickerContext = () => {
  const value = React2.useContext(PickerContext);
  if (value == null) {
    throw new Error("MUI X: The `usePickerContext` hook can only be called inside the context of a Picker component");
  }
  return value;
};

// node_modules/@mui/x-date-pickers/esm/internals/components/PickerProvider.js
var React4 = __toESM(require_react(), 1);

// node_modules/@mui/x-date-pickers/esm/internals/hooks/useNullableFieldPrivateContext.js
var React3 = __toESM(require_react(), 1);
var PickerFieldPrivateContext = React3.createContext(null);
if (true) PickerFieldPrivateContext.displayName = "PickerFieldPrivateContext";
function useNullableFieldPrivateContext() {
  return React3.useContext(PickerFieldPrivateContext);
}

// node_modules/@mui/x-date-pickers/esm/internals/components/PickerProvider.js
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var PickerActionsContext = React4.createContext(null);
if (true) PickerActionsContext.displayName = "PickerActionsContext";
var PickerPrivateContext = React4.createContext({
  ownerState: {
    isPickerDisabled: false,
    isPickerReadOnly: false,
    isPickerValueEmpty: false,
    isPickerOpen: false,
    pickerVariant: "desktop",
    pickerOrientation: "portrait"
  },
  rootRefObject: {
    current: null
  },
  labelId: void 0,
  dismissViews: () => {
  },
  hasUIView: true,
  getCurrentViewMode: () => "UI",
  triggerElement: null,
  viewContainerRole: null,
  defaultActionBarActions: [],
  onPopperExited: void 0
});
if (true) PickerPrivateContext.displayName = "PickerPrivateContext";
function PickerProvider(props) {
  const {
    contextValue,
    actionsContextValue,
    privateContextValue,
    fieldPrivateContextValue,
    isValidContextValue,
    localeText,
    children
  } = props;
  return (0, import_jsx_runtime.jsx)(PickerContext.Provider, {
    value: contextValue,
    children: (0, import_jsx_runtime.jsx)(PickerActionsContext.Provider, {
      value: actionsContextValue,
      children: (0, import_jsx_runtime.jsx)(PickerPrivateContext.Provider, {
        value: privateContextValue,
        children: (0, import_jsx_runtime.jsx)(PickerFieldPrivateContext.Provider, {
          value: fieldPrivateContextValue,
          children: (0, import_jsx_runtime.jsx)(IsValidValueContext.Provider, {
            value: isValidContextValue,
            children: (0, import_jsx_runtime.jsx)(LocalizationProvider, {
              localeText,
              children
            })
          })
        })
      })
    })
  });
}

// node_modules/@mui/x-date-pickers/esm/internals/hooks/usePickerPrivateContext.js
var React5 = __toESM(require_react(), 1);
var usePickerPrivateContext = () => React5.useContext(PickerPrivateContext);

export {
  useIsValidValue,
  useNullableFieldPrivateContext,
  PickerContext,
  usePickerContext,
  PickerActionsContext,
  PickerProvider,
  usePickerPrivateContext
};
//# sourceMappingURL=chunk-OKWI2M2W.js.map
