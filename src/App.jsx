import React, { useEffect, useState } from "react";
import dfsJson from "./DFS Calculator.json";

function App() {
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState("");
  const [operationResults, setOperationResults] = useState({});

  useEffect(() => {
    const initialData = {};
    dfsJson.fields.forEach((field) => {
      initialData[field.id] = field.type === "CHECKBOX" ? [] : "";
    });
    setFormData(initialData);
  }, []);

  const handleChange = (fieldId, value, isCheckbox = false) => {
    setFormData((prev) => {
      if (isCheckbox) {
        const current = prev[fieldId] || [];
        const newVal = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, [fieldId]: newVal };
      }
      return { ...prev, [fieldId]: value };
    });
  };

  const evaluateNestedIfElse = (expr, context) => {
    if (!expr.includes("ifelse")) return evalTextBlock(expr);

    const ifelseRegex = /ifelse\((.*?),\s*(.*?),\s*(.*)\)$/s;
    const match = expr.match(ifelseRegex);
    if (!match) return "Invalid expression";

    const [, condition, trueExp, falseExp] = match;
    let conditionResult = false;

    try {
      const evalCondition = new Function("ctx", `with (ctx) { return (${condition.replace(/==/g, "===")}); }`);
      conditionResult = evalCondition(context);
    } catch (e) {
      console.error("Condition evaluation error", e);
    }

    const nextExp = conditionResult ? trueExp.trim() : falseExp.trim();
    return evaluateNestedIfElse(nextExp, context);
  };

  const evalTextBlock = (block) => {
    return block
      .replace(/paragraph\("(.*?)"\)/g, "$1\n")
      .replace(/link\("(.*?)",\s*"(.*?)"\)/g, "$1 ($2)")
      .replace(/\+\s*/g, "");
  };

  const evaluateOperations = () => {
    const opResults = {};
    const ctx = { ...formData };

    dfsJson.operations.forEach((op) => {
      try {
        const evalOp = new Function("ctx", `with (ctx) { return (${op.expression.replace(/==/g, "===")}); }`);
        const result = evalOp({ ...ctx, ...opResults });
        opResults[op.id] = result;
      } catch (e) {
        console.error(`Failed to evaluate ${op.id}:`, e);
        opResults[op.id] = null;
      }
    });

    return opResults;
  };

  const evaluateLogic = () => {
    const opResults = evaluateOperations();
    setOperationResults(opResults);

    const resultOperation = dfsJson.operations.find((op) => op.title === "Results");
    if (resultOperation) {
      const output = evaluateNestedIfElse(resultOperation.expression, {
        ...formData,
        ...opResults,
      });
      setResult(output);
    } else {
      setResult("No result operation found.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{dfsJson.title}</h1>
      <p className="mb-6 text-sm text-gray-600">{dfsJson.description}</p>
      <form className="space-y-6">
        {dfsJson.fields.map((field) => (
          <div key={field.id}>
            <label className="block font-semibold mb-1">{field.title}</label>
            <p className="text-sm text-gray-500 mb-2">{field.description}</p>
            {field.type === "RADIO" &&
              field.options.map((opt) => (
                <div key={opt.label}>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name={field.id}
                      value={opt.label}
                      checked={formData[field.id] === opt.label}
                      onChange={() => handleChange(field.id, opt.label)}
                      className="mr-2"
                    />
                    {opt.label}
                  </label>
                </div>
              ))}
            {field.type === "CHECKBOX" &&
              field.options.map((opt) => (
                <div key={opt.label}>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      value={opt.label}
                      checked={formData[field.id]?.includes(opt.label)}
                      onChange={() => handleChange(field.id, opt.label, true)}
                      className="mr-2"
                    />
                    {opt.label}
                  </label>
                </div>
              ))}
            {field.type === "DROPDOWN" && (
              <select
                value={formData[field.id]}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className="border rounded p-2 w-full"
              >
                <option value="">-- Select --</option>
                {field.options.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={evaluateLogic}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow"
        >
          Evaluate
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="text-lg font-semibold">Result</h2>
          <pre className="mt-2 whitespace-pre-line">{result}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
