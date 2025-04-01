import React, { useEffect, useMemo } from "react";
import { Button, AutoComplete, message, Dropdown, Menu } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useFormulaStore } from "../store/formulaStore";

interface Variable {
  id: number;
  name: string;
  value: number;
}

const FormulaInput: React.FC = () => {
  const { formula, result, setFormula, setResult } = useFormulaStore();

  const { data: variables, error } = useQuery<Variable[]>({
    queryKey: ["variables"],
    queryFn: async () => {
      const response = await fetch(
        "https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete"
      );
      if (!response.ok) throw new Error("Network error");
      return response.json();
    },
  });

  const options = useMemo(() => {
    const match = formula.match(/(\w+)$/);
    const searchTerm = match ? match[1] : "";
    if (!searchTerm || !variables) return [];

    return variables
      .filter((variable) =>
        variable.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((variable) => ({
        value: variable.name,
        label: `${variable.name} = ${variable.value}`,
      }));
  }, [formula, variables]);

  useEffect(() => {
    if (error) message.error("Error fetching variables!");
  }, [error]);

  const evaluateFormula = () => {
    if (!variables) {
      message.error("Variables not loaded yet");
      return;
    }

    let substitutedFormula = formula;
    variables.forEach((variable) => {
      substitutedFormula = substitutedFormula.replace(
        new RegExp(`\\[${variable.name}\\]`, "g"),
        variable.value.toString()
      );
    });

    try {
      const evalResult = Function(
        "return " + substitutedFormula.replace(/\^/g, "**")
      )();
      if (typeof evalResult === "number") {
        setResult(evalResult);
      } else {
        message.error("Invalid formula!");
      }
    } catch (error) {
      console.log(error);

      message.error("Error evaluating formula!");
    }
  };

  const handleInputChange = (value: string) => {
    setFormula(value);
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

    newFormula = parts.join("");
    setFormula(newFormula);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      evaluateFormula();
    }
  };

  const handleMenuClick = (e: any, currentTag: string) => {
    const selectedVariable = e.key;
    const updatedFormula = formula.replace(
      `[${currentTag}]`,
      `[${selectedVariable}]`
    );
    setFormula(updatedFormula);
  };

  const renderTagWithDropdown = (tag: string) => {
    const usedVariables =
      formula.match(/\[([^\]]+)\]/g)?.map((item) => item.slice(1, -1)) || [];
    const availableVariables = variables
      ? variables
          .filter((variable) => !usedVariables.includes(variable.name))
          .map((variable) => variable.name)
      : [];

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
        onKeyDown={handleKeyPress}
        style={{ width: "100%", marginTop: "10px" }}
        options={options}
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
