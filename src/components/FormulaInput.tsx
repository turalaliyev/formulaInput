import React from "react";
import { Button, AutoComplete, message, Dropdown, Menu } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";

interface Variable {
  id: number;
  name: string;
  value: number;
}

interface FormulaState {
  formula: string;
  result: number | null;
  setFormula: (formula: string) => void;
  setResult: (result: number | null) => void;
}

const useFormulaStore = create<FormulaState>((set) => ({
  formula: "",
  result: null,
  setFormula: (formula) => set({ formula }),
  setResult: (result) => set({ result }),
}));

const fetchVariables = async (): Promise<Variable[]> => {
  const response = await fetch(
    "https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete"
  );
  if (!response.ok) throw new Error("Error fetching variables!");
  return response.json();
};

const FormulaInput: React.FC = () => {
  const { formula, result, setFormula, setResult } = useFormulaStore();
  const { data: variables = [] } = useQuery({
    queryKey: ["variables"],
    queryFn: fetchVariables,
  });

  const evaluateFormula = () => {
    let substitutedFormula = formula;

    variables.forEach((variable) => {
      const regex = new RegExp(`\\[${variable.name}\\]`, "g");
      substitutedFormula = substitutedFormula.replace(
        regex,
        variable.value.toString()
      );
    });

    substitutedFormula = substitutedFormula.replace(/\^/g, "**");

    try {
      const evalResult = Function("return " + substitutedFormula)();
      if (typeof evalResult === "number") {
        setResult(evalResult);
      } else {
        message.error("Invalid formula!");
      }
    } catch (error) {
      console.log(error);
      message.error("Error evaluating the formula!");
    }
  };

  const handleInputChange = (value: string) => {
    setFormula(value);
    updateAutoCompleteOptions(value);
  };

  const updateAutoCompleteOptions = (value: string) => {
    const match = value.match(/(\w+)$/);
    const searchTerm = match ? match[1] : "";
    return variables
      .filter((variable) =>
        variable.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((variable) => ({
        value: variable.name,
        label: `${variable.name} = ${variable.value}`,
      }));
  };

  const handleSelect = (selectedValue: string) => {
    let newFormula = formula.trim();
    const parts = newFormula.split(/([\s+\-*/])/);

    for (let i = parts.length - 1; i >= 0; i--) {
      if (
        !["+", "-", "*", "/"].includes(parts[i].trim()) &&
        parts[i].trim() !== ""
      ) {
        parts[i] = `[${selectedValue}]`;
        break;
      }
    }
    setFormula(parts.join(""));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      evaluateFormula();
    }
  };

  const handleMenuClick = (e: any, currentTag: string) => {
    const selectedVariable = e.key;
    setFormula(formula.replace(`[${currentTag}]`, `[${selectedVariable}]`));
  };

  const renderTagWithDropdown = (tag: string) => {
    const usedVariables =
      formula.match(/\[([^\]]+)\]/g)?.map((item) => item.slice(1, -1)) || [];
    const availableVariables = variables
      .filter((variable) => !usedVariables.includes(variable.name))
      .map((variable) => variable.name);

    const menu = (
      <Menu onClick={(e) => handleMenuClick(e, tag)}>
        {availableVariables.map((variable) => (
          <Menu.Item key={variable}>{variable}</Menu.Item>
        ))}
      </Menu>
    );

    return (
      <span
        style={{
          backgroundColor: "#d9d9d9",
          padding: "2px 6px",
          borderRadius: "4px",
          margin: "2px",
        }}
      >
        {tag}{" "}
        <Dropdown overlay={menu} trigger={["click"]}>
          <DownOutlined style={{ cursor: "pointer" }} />
        </Dropdown>
      </span>
    );
  };

  return (
    <div
      className="formula-container"
      style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}
    >
      <div
        className="formula-box"
        style={{
          padding: "8px",
          border: "1px solid #d9d9d9",
          borderRadius: "4px",
          minHeight: "40px",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          cursor: "text",
        }}
      >
        {formula
          .split(/(\[.*?\])/)
          .map((part, index) =>
            part.startsWith("[") && part.endsWith("]") ? (
              <span key={index}>
                {renderTagWithDropdown(part.slice(1, -1))}
              </span>
            ) : (
              <span key={index}>{part}</span>
            )
          )}
      </div>

      <AutoComplete
        value={formula}
        onChange={handleInputChange}
        onSelect={handleSelect}
        onSearch={updateAutoCompleteOptions}
        onKeyDown={handleKeyPress}
        style={{ width: "100%", marginTop: "10px" }}
        options={updateAutoCompleteOptions(formula)}
        placeholder="Enter formula (e.g., [name1] + [name2])"
      />
      <Button
        type="primary"
        onClick={evaluateFormula}
        style={{ marginTop: "10px" }}
      >
        Calculate
      </Button>

      {result !== null && (
        <div style={{ marginTop: "20px", fontSize: "18px" }}>
          Result: {result}
        </div>
      )}
    </div>
  );
};

export default FormulaInput;
