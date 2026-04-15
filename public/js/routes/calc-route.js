(function () {
	const modules = window.NebulaRouteModules = window.NebulaRouteModules || {};

	const PI = Math.PI;
	const E = Math.E;

	const state = {
		history: [],
		mode: "scientific",
		angleMode: "deg",
		memory: 0,
		lastAnswer: 0,
		root: null
	};

	function escapeHtml(value) {
		return String(value || "")
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#39;");
	}

	function animateIn(node, delay) {
		if (!node) {
			return;
		}
		node.style.animationDelay = `${Math.max(0, Number(delay) || 0)}ms`;
	}

	function readInput(id) {
		const node = state.root ? state.root.querySelector(id) : null;
		return node ? String(node.value || "") : "";
	}

	function setOutput(text, ok) {
		const node = state.root ? state.root.querySelector("#calc-output") : null;
		if (!node) {
			return;
		}
		node.textContent = String(text || "");
		node.classList.toggle("is-error", ok === false);
		node.classList.toggle("is-ok", ok !== false);
	}

	function setHistoryEntry(label, value) {
		state.history.unshift({
			label: String(label || ""),
			value: String(value || "")
		});
		state.history = state.history.slice(0, 12);
		renderHistory();
	}

	function renderHistory() {
		if (!state.root) {
			return;
		}
		const list = state.root.querySelector("#calc-history-list");
		if (!list) {
			return;
		}
		if (!state.history.length) {
			list.innerHTML = '<p class="calc-history-empty">No calculations yet.</p>';
			return;
		}
		list.innerHTML = state.history.map((item) => `
			<article class="calc-history-item">
				<span>${escapeHtml(item.label)}</span>
				<strong>${escapeHtml(item.value)}</strong>
			</article>
		`).join("");
	}

	function toRadians(value) {
		return state.angleMode === "deg" ? (value * PI) / 180 : value;
	}

	function factorial(value) {
		const n = Number(value);
		if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
			throw new Error("Factorial requires a non-negative integer.");
		}
		let result = 1;
		for (let i = 2; i <= n; i += 1) {
			result *= i;
		}
		return result;
	}

	function tokenizer(expression) {
		const text = String(expression || "");
		const tokens = [];
		const regex = /\s*([A-Za-z_]+|\d*\.?\d+(?:e[+-]?\d+)?|\^|[()+\-*/%,!])\s*/gy;
		let index = 0;
		while (index < text.length) {
			regex.lastIndex = index;
			const match = regex.exec(text);
			if (!match || match.index !== index) {
				throw new Error(`Unexpected character near: ${text.slice(index, index + 12)}`);
			}
			tokens.push(match[1]);
			index = regex.lastIndex;
		}
		return tokens;
	}

	function isNumberToken(token) {
		return /^\d*\.?\d+(?:e[+-]?\d+)?$/i.test(token);
	}

	function isIdentifier(token) {
		return /^[A-Za-z_]+$/.test(token);
	}

	function isFunctionName(name) {
		return [
			"sin", "cos", "tan", "asin", "acos", "atan",
			"sqrt", "abs", "ln", "log", "round", "floor", "ceil",
			"min", "max"
		].includes(String(name || "").toLowerCase());
	}

	function applyFunction(name, args) {
		const lower = String(name || "").toLowerCase();
		const first = Number(args[0]);
		switch (lower) {
			case "sin": return Math.sin(toRadians(first));
			case "cos": return Math.cos(toRadians(first));
			case "tan": return Math.tan(toRadians(first));
			case "asin": return state.angleMode === "deg" ? (Math.asin(first) * 180) / PI : Math.asin(first);
			case "acos": return state.angleMode === "deg" ? (Math.acos(first) * 180) / PI : Math.acos(first);
			case "atan": return state.angleMode === "deg" ? (Math.atan(first) * 180) / PI : Math.atan(first);
			case "sqrt": return Math.sqrt(first);
			case "abs": return Math.abs(first);
			case "ln": return Math.log(first);
			case "log": return Math.log10(first);
			case "round": return Math.round(first);
			case "floor": return Math.floor(first);
			case "ceil": return Math.ceil(first);
			case "min": return Math.min(...args.map(Number));
			case "max": return Math.max(...args.map(Number));
			default:
				throw new Error(`Unknown function: ${name}`);
		}
	}

	function precedence(operator) {
		switch (operator) {
			case "u-": return 5;
			case "!": return 6;
			case "^": return 4;
			case "*":
			case "/":
			case "%": return 3;
			case "+":
			case "-": return 2;
			default: return 0;
		}
	}

	function isRightAssociative(operator) {
		return operator === "^" || operator === "u-";
	}

	function toRpn(tokens) {
		const output = [];
		const ops = [];
		const argCounts = [];
		let prevType = "start";

		for (let i = 0; i < tokens.length; i += 1) {
			const token = tokens[i];

			if (isNumberToken(token)) {
				output.push({ type: "number", value: Number(token) });
				prevType = "value";
				continue;
			}

			if (isIdentifier(token)) {
				const next = tokens[i + 1];
				if (next === "(") {
					ops.push({ type: "function", value: token });
					argCounts.push(1);
				} else {
					output.push({ type: "symbol", value: token });
				}
				prevType = "value";
				continue;
			}

			if (token === ",") {
				while (ops.length && ops[ops.length - 1].value !== "(") {
					output.push(ops.pop());
				}
				if (!argCounts.length) {
					throw new Error("Misplaced comma.");
				}
				argCounts[argCounts.length - 1] += 1;
				prevType = "comma";
				continue;
			}

			if (token === "(") {
				ops.push({ type: "paren", value: "(" });
				prevType = "paren-open";
				continue;
			}

			if (token === ")") {
				while (ops.length && ops[ops.length - 1].value !== "(") {
					output.push(ops.pop());
				}
				if (!ops.length) {
					throw new Error("Mismatched parentheses.");
				}
				ops.pop();
				const top = ops[ops.length - 1];
				if (top && top.type === "function") {
					const fn = ops.pop();
					output.push({ type: "function", value: fn.value, argc: argCounts.pop() || 1 });
				} else if (argCounts.length) {
					argCounts.pop();
				}
				prevType = "value";
				continue;
			}

			let operator = token;
			if (operator === "-" && (prevType === "start" || prevType === "operator" || prevType === "paren-open" || prevType === "comma")) {
				operator = "u-";
			}

			if (["+", "-", "*", "/", "%", "^", "u-", "!"].includes(operator)) {
				while (ops.length) {
					const top = ops[ops.length - 1];
					if (!top || !["operator", "function"].includes(top.type)) {
						break;
					}
					const topPrec = precedence(top.value);
					const nextPrec = precedence(operator);
					if (topPrec > nextPrec || (topPrec === nextPrec && !isRightAssociative(operator))) {
						output.push(ops.pop());
					} else {
						break;
					}
				}
				ops.push({ type: "operator", value: operator });
				prevType = "operator";
				continue;
			}

			throw new Error(`Unknown token: ${token}`);
		}

		while (ops.length) {
			const op = ops.pop();
			if (op.value === "(") {
				throw new Error("Mismatched parentheses.");
			}
			output.push(op);
		}

		return output;
	}

	function evalRpn(rpn) {
		const stack = [];
		for (const token of rpn) {
			if (token.type === "number") {
				stack.push(token.value);
				continue;
			}

			if (token.type === "symbol") {
				const name = String(token.value).toLowerCase();
				if (name === "pi" || name === "π") {
					stack.push(PI);
				} else if (name === "e") {
					stack.push(E);
				} else if (name === "ans") {
					stack.push(state.lastAnswer);
				} else if (name === "m") {
					stack.push(state.memory);
				} else {
					throw new Error(`Unknown symbol: ${token.value}`);
				}
				continue;
			}

			if (token.type === "function") {
				const argc = Math.max(1, Number(token.argc) || 1);
				const args = stack.splice(Math.max(0, stack.length - argc), argc);
				stack.push(applyFunction(token.value, args));
				continue;
			}

			if (token.type === "operator") {
				if (token.value === "u-") {
					if (!stack.length) {
						throw new Error("Missing value for negation.");
					}
					stack.push(-stack.pop());
					continue;
				}
				if (token.value === "!") {
					if (!stack.length) {
						throw new Error("Missing value for factorial.");
					}
					stack.push(factorial(stack.pop()));
					continue;
				}

				const right = stack.pop();
				const left = stack.pop();
				if (!Number.isFinite(left) || !Number.isFinite(right)) {
					throw new Error("Invalid expression.");
				}

				switch (token.value) {
					case "+": stack.push(left + right); break;
					case "-": stack.push(left - right); break;
					case "*": stack.push(left * right); break;
					case "/": stack.push(left / right); break;
					case "%": stack.push(left % right); break;
					case "^": stack.push(left ** right); break;
					default: throw new Error(`Unknown operator: ${token.value}`);
				}
			}
		}

		if (stack.length !== 1 || !Number.isFinite(stack[0])) {
			throw new Error("Invalid expression.");
		}
		return stack[0];
	}

	function evaluateExpression(expression) {
		const cleaned = String(expression || "")
			.replaceAll("×", "*")
			.replaceAll("÷", "/")
			.replaceAll("π", "pi")
			.replace(/\bpow\s*\(/gi, "pow(")
			.trim();
		if (!cleaned) {
			throw new Error("Enter an expression.");
		}

		const tokens = tokenizer(cleaned);
		const rpn = toRpn(tokens);
		return evalRpn(rpn);
	}

	function parsePolynomialSide(expression) {
		const source = String(expression || "").replace(/\s+/g, "");
		if (!source) {
			return { a: 0, b: 0, c: 0 };
		}

		const terms = source.match(/[+-]?[^+-]+/g) || [];
		const poly = { a: 0, b: 0, c: 0 };

		terms.forEach((term) => {
			if (!term) {
				return;
			}
			const normalized = term.replace(/\*+/g, "*");
			if (/x\^2/i.test(normalized)) {
				const coeff = normalized.replace(/x\^2/i, "").replace(/\*$/, "");
				poly.a += Number(coeff || (normalized.startsWith("-") ? "-1" : "1"));
				return;
			}
			if (/x/i.test(normalized)) {
				const coeff = normalized.replace(/x/i, "").replace(/\*$/, "");
				poly.b += Number(coeff || (normalized.startsWith("-") ? "-1" : "1"));
				return;
			}
			poly.c += Number(normalized);
		});

		return poly;
	}

	function solveEquation(input) {
		const expr = String(input || "").trim();
		if (!expr) {
			throw new Error("Enter an equation.");
		}

		const parts = expr.split("=");
		if (parts.length !== 2) {
			throw new Error("Use an equals sign, like 2x+4=10.");
		}

		const left = parsePolynomialSide(parts[0]);
		const right = parsePolynomialSide(parts[1]);
		const a = left.a - right.a;
		const b = left.b - right.b;
		const c = left.c - right.c;

		if (Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12) {
			if (Math.abs(c) < 1e-12) {
				return "Infinite solutions";
			}
			return "No solution";
		}

		if (Math.abs(a) < 1e-12) {
			return `x = ${formatNumber(-c / b)}`;
		}

		const discriminant = b * b - 4 * a * c;
		if (discriminant < 0) {
			const real = (-b / (2 * a)).toFixed(6);
			const imag = (Math.sqrt(Math.abs(discriminant)) / (2 * Math.abs(a))).toFixed(6);
			return `x = ${real} + ${imag}i, x = ${real} - ${imag}i`;
		}

		const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
		const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
		if (Math.abs(root1 - root2) < 1e-12) {
			return `x = ${formatNumber(root1)}`;
		}
		return `x = ${formatNumber(root1)}, x = ${formatNumber(root2)}`;
	}

	function formatNumber(value) {
		const numeric = Number(value);
		if (!Number.isFinite(numeric)) {
			return String(value);
		}
		if (Math.abs(numeric) >= 1e10 || (Math.abs(numeric) > 0 && Math.abs(numeric) < 1e-6)) {
			return numeric.toExponential(8).replace(/\.0+e/, "e");
		}
		return Number(numeric.toFixed(10)).toString();
	}

	function piTools() {
		const radius = Number(readInput("#calc-pi-radius"));
		const diameter = Number(readInput("#calc-pi-diameter"));
		const sides = Number(readInput("#calc-pi-sides"));
		const decimalPlaces = Math.max(0, Math.min(20, Number(readInput("#calc-pi-decimals")) || 8));
		const area = Number.isFinite(radius) ? PI * radius * radius : null;
		const circumference = Number.isFinite(radius) ? 2 * PI * radius : null;
		const fromDiameter = Number.isFinite(diameter) ? diameter * PI : null;
		const polygonApprox = Number.isFinite(sides) && sides >= 3 ? (sides * Math.sin(PI / sides)) / 2 : null;

		const lines = [
			`π ≈ ${PI.toFixed(decimalPlaces)}`
		];
		if (area !== null) {
			lines.push(`Area = ${formatNumber(area)}`);
		}
		if (circumference !== null) {
			lines.push(`Circumference = ${formatNumber(circumference)}`);
		}
		if (fromDiameter !== null) {
			lines.push(`Diameter × π = ${formatNumber(fromDiameter)}`);
		}
		if (polygonApprox !== null) {
			lines.push(`Polygon approximation factor = ${formatNumber(polygonApprox)}`);
		}
		return lines.join("\n");
	}

	function applyPreset(value) {
		const input = state.root ? state.root.querySelector("#calc-expression") : null;
		if (!input) {
			return;
		}
		input.value = value;
		input.focus();
	}

	function renderModePanel() {
		if (!state.root) {
			return;
		}
		const panels = state.root.querySelectorAll("[data-calc-panel]");
		panels.forEach((panel) => {
			panel.classList.toggle("hidden", panel.getAttribute("data-calc-panel") !== state.mode);
		});
		const tabs = state.root.querySelectorAll("[data-calc-tab]");
		tabs.forEach((tab) => {
			tab.classList.toggle("active", tab.getAttribute("data-calc-tab") === state.mode);
		});
	}

	function buildShell() {
		return `
			<style>
				@keyframes calcFadeIn {
					0% { opacity: 0; transform: translateY(20px) scale(0.985); filter: blur(6px); }
					100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
				}

				@keyframes calcGlow {
					0%, 100% { transform: translateY(0) scale(1); opacity: 0.45; }
					50% { transform: translateY(-6px) scale(1.04); opacity: 0.8; }
				}

				@keyframes calcSweep {
					0% { transform: translateX(-120%); }
					100% { transform: translateX(120%); }
				}

				.calc-shell {
					position: relative;
					width: min(1180px, calc(100% - 1rem));
					margin: 0 auto;
					height: calc(100dvh - 0.75rem);
					padding: 0.35rem 0 0.4rem;
					color: rgba(245, 250, 255, 0.96);
					overflow: hidden;
					box-sizing: border-box;
				}

				.calc-shell::before {
					content: "";
					position: absolute;
					inset: 0;
					background:
						radial-gradient(900px 500px at 12% 0%, rgba(90, 207, 255, 0.16), transparent 58%),
						radial-gradient(800px 420px at 88% 6%, rgba(130, 132, 255, 0.12), transparent 54%),
						linear-gradient(180deg, rgba(255,255,255,0.02), transparent 24%);
					pointer-events: none;
					border-radius: 28px;
				}

				.calc-hero {
					display: none;
				}

				.calc-badges {
					display: none;
					flex-wrap: wrap;
					justify-content: flex-end;
					gap: 0.5rem;
				}

				.calc-badge {
					padding: 0.55rem 0.8rem;
					border-radius: 999px;
					border: 1px solid rgba(255,255,255,0.15);
					background: rgba(255,255,255,0.06);
					backdrop-filter: blur(14px) saturate(150%);
					-webkit-backdrop-filter: blur(14px) saturate(150%);
					color: rgba(240, 247, 255, 0.86);
					font-size: 0.72rem;
					letter-spacing: 0.08em;
					text-transform: uppercase;
					animation: calcFadeIn 0.7s ease both;
				}

				.calc-grid {
					position: relative;
					z-index: 1;
					display: grid;
					grid-template-columns: minmax(0, 1.15fr) minmax(250px, 0.68fr);
					gap: 0.6rem;
					height: calc(100% - 0.25rem);
					align-items: stretch;
				}

				.calc-card {
					position: relative;
					overflow: hidden;
					border-radius: 20px;
					border: 1px solid rgba(183, 212, 255, 0.16);
					background:
						linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04)),
						rgba(11, 15, 28, 0.76);
					backdrop-filter: blur(20px) saturate(155%);
					-webkit-backdrop-filter: blur(20px) saturate(155%);
					box-shadow: 0 24px 70px rgba(0,0,0,0.48);
					height: 100%;
					min-height: 0;
					animation: calcFadeIn 0.65s ease both;
				}

				.calc-card::before {
					content: "";
					position: absolute;
					inset: 0;
					background: linear-gradient(115deg, transparent 26%, rgba(255,255,255,0.18) 50%, transparent 74%);
					transform: translateX(-120%);
					opacity: 0.45;
					pointer-events: none;
				}

				.calc-card:hover::before {
					animation: calcSweep 1.1s ease forwards;
				}

				.calc-card-head {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 0.4rem;
					padding: 0.45rem 0.55rem 0;
				}

				.calc-card-head:empty {
					display: none;
				}

				.calc-tabs {
					display: grid;
					grid-template-columns: repeat(4, minmax(0, 1fr));
					gap: 0.3rem;
					padding: 0.35rem 0.45rem 0.25rem;
				}

				.calc-tab {
					border: 1px solid rgba(255,255,255,0.12);
					border-radius: 10px;
					padding: 0.38rem 0.5rem;
					background: rgba(255,255,255,0.06);
					color: rgba(244, 249, 255, 0.82);
					font-size: 0.62rem;
					letter-spacing: 0.05em;
					text-transform: uppercase;
					cursor: pointer;
					transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease;
				}

				.calc-tab:hover,
				.calc-tab.active {
					transform: translateY(-2px);
					border-color: rgba(153, 220, 255, 0.42);
					background: rgba(140, 213, 255, 0.15);
					box-shadow: 0 0 0 1px rgba(153, 220, 255, 0.18) inset;
				}

				.calc-main {
					display: flex;
					flex-direction: column;
					gap: 0.45rem;
					height: calc(100% - 1.1rem);
					padding: 0 0.45rem 0.45rem;
					min-height: 0;
				}

				.calc-panel {
					display: grid;
					grid-template-columns: minmax(0, 1fr);
					gap: 0.45rem;
					animation: calcFadeIn 0.45s ease both;
					min-height: 0;
				}

				.calc-panel.hidden {
					display: none;
				}

				.calc-display {
					position: relative;
					min-height: 84px;
					padding: 0.55rem;
					border-radius: 14px;
					border: 1px solid rgba(255,255,255,0.14);
					background:
						radial-gradient(120% 120% at 100% 0%, rgba(99, 226, 255, 0.14), transparent 42%),
						rgba(4, 8, 18, 0.74);
					box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
				}

				.calc-display::after {
					content: "";
					position: absolute;
					inset: 0;
					border-radius: 14px;
					background: linear-gradient(135deg, rgba(255,255,255,0.07), transparent 22%, transparent 72%, rgba(255,255,255,0.05));
					pointer-events: none;
				}

				.calc-display-label {
					display: none;
				}

				.calc-output {
					min-height: 26px;
					font-size: clamp(0.88rem, 1.35vw, 1.24rem);
					font-weight: 500;
					line-height: 1.25;
					word-break: break-word;
					color: #eef8ff;
					text-shadow: 0 0 20px rgba(147, 222, 255, 0.16);
					white-space: pre-wrap;
				}

				.calc-output.is-error {
					color: #ffb3b3;
				}

				.calc-input {
					width: 100%;
					border: 1px solid rgba(255,255,255,0.14);
					border-radius: 11px;
					background: rgba(6, 10, 20, 0.78);
					color: #fff;
					padding: 0.48rem 0.58rem;
					outline: none;
					font-size: 0.78rem;
					transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
				}

				.calc-input:focus {
					border-color: rgba(140, 219, 255, 0.48);
					box-shadow: 0 0 0 3px rgba(140, 219, 255, 0.16);
				}

				.calc-toolbar,
				.calc-keypad,
				.calc-converters,
				.calc-pi-grid {
					display: grid;
					gap: 0.28rem;
				}

				.calc-toolbar {
					grid-template-columns: repeat(auto-fit, minmax(76px, 1fr));
				}

				.calc-keypad {
					grid-template-columns: repeat(4, minmax(0, 1fr));
					gap: 0.24rem;
				}

				.calc-converters {
					grid-template-columns: repeat(2, minmax(0, 1fr));
					gap: 0.24rem;
				}

				.calc-pi-grid {
					grid-template-columns: repeat(2, minmax(0, 1fr));
					gap: 0.24rem;
				}

				.calc-btn,
				.calc-control {
					position: relative;
					overflow: hidden;
					border: 1px solid rgba(255,255,255,0.13);
					border-radius: 10px;
					background: rgba(255,255,255,0.07);
					color: #f3f8ff;
					padding: 0.36rem 0.48rem;
					font: inherit;
					cursor: pointer;
					transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
					font-size: 0.68rem;
					line-height: 1.15;
					min-width: 0;
				}

				.calc-btn::before,
				.calc-control::before {
					content: "";
					position: absolute;
					inset: 0;
					background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.16) 50%, transparent 70%);
					transform: translateX(-120%);
					opacity: 0.6;
					pointer-events: none;
				}

				.calc-btn:hover,
				.calc-control:hover {
					transform: translateY(-2px);
					border-color: rgba(157, 223, 255, 0.4);
					background: rgba(145, 223, 255, 0.14);
					box-shadow: 0 0 0 1px rgba(145, 223, 255, 0.16) inset;
				}

				.calc-btn:hover::before,
				.calc-control:hover::before {
					animation: calcSweep 0.9s ease forwards;
				}

				.calc-btn.primary {
					background: linear-gradient(180deg, rgba(119, 213, 255, 0.38), rgba(76, 151, 255, 0.24));
					border-color: rgba(160, 225, 255, 0.5);
					box-shadow: 0 10px 18px rgba(40, 142, 205, 0.18);
				}

				.calc-btn.danger {
					background: rgba(255, 110, 110, 0.12);
					border-color: rgba(255, 160, 160, 0.28);
				}

				.calc-btn.wide {
					grid-column: span 2;
				}

				.calc-section-title {
					display: none;
				}

				.calc-card-body {
					padding: 0 0.45rem 0.45rem;
				}

				.calc-history {
					display: grid;
					gap: 0.35rem;
					max-height: 100%;
					overflow: auto;
					padding-right: 0.2rem;
				}

				.calc-history-item,
				.calc-history-empty {
					border: 1px solid rgba(255,255,255,0.12);
					border-radius: 12px;
					background: rgba(255,255,255,0.05);
					padding: 0.48rem 0.6rem;
				}

				.calc-history-item span {
					display: block;
					color: rgba(230, 241, 255, 0.64);
					font-size: 0.62rem;
					text-transform: uppercase;
					letter-spacing: 0.08em;
					margin-bottom: 0.2rem;
				}

				.calc-history-item strong {
					color: rgba(255,255,255,0.96);
					font-size: 0.8rem;
					word-break: break-word;
				}

				.calc-status {
					margin-top: 0.38rem;
					color: rgba(230, 241, 255, 0.68);
					font-size: 0.72rem;
					line-height: 1.5;
					white-space: pre-wrap;
				}

				.calc-status strong {
					color: #fff;
				}

				.calc-grid-2 {
					display: grid;
					grid-template-columns: repeat(2, minmax(0, 1fr));
					gap: 0.24rem;
				}

				.calc-grid-3 {
					display: grid;
					grid-template-columns: repeat(3, minmax(0, 1fr));
					gap: 0.24rem;
				}

				.calc-math-row {
					display: flex;
					gap: 0.24rem;
					flex-wrap: wrap;
					justify-content: flex-end;
				}

				.calc-math-row .calc-control {
					flex: 0 0 auto;
					padding-inline: 0.45rem;
				}

				@media (max-width: 1100px) {
					.calc-grid {
						grid-template-columns: 1fr;
					}
					.calc-history {
						max-height: none;
					}
				}

				@media (max-width: 760px) {
					.calc-shell {
						height: auto;
						min-height: calc(100dvh - 0.75rem);
						width: min(100% - 0.75rem, 1380px);
					}
					.calc-tabs {
						grid-template-columns: repeat(2, minmax(0, 1fr));
					}
					.calc-keypad,
					.calc-pi-grid,
					.calc-converters,
					.calc-grid-2,
					.calc-grid-3 {
						grid-template-columns: 1fr;
					}
					.calc-btn.wide {
						grid-column: span 1;
					}
					.calc-grid {
						height: auto;
					}
				}
			</style>

			<div class="calc-shell">
					<div class="calc-badges">
						<span class="calc-badge">${escapeHtml(state.mode)}</span>
						<span class="calc-badge">${escapeHtml(state.angleMode.toUpperCase())}</span>
						<span class="calc-badge">M: ${escapeHtml(formatNumber(state.memory))}</span>
					</div>

				<div class="calc-grid">
					<section class="calc-card">
						<div class="calc-card-head">
							<div class="calc-math-row">
									<button type="button" class="calc-control" data-calc-action="toggle-angle">${escapeHtml(state.angleMode.toUpperCase())}</button>
								<button type="button" class="calc-control" data-calc-action="memory-read">M+</button>
								<button type="button" class="calc-control" data-calc-action="memory-clear">MC</button>
							</div>
						</div>

						<div class="calc-main">
							<div class="calc-display">
								<div class="calc-output is-ok" id="calc-output">0</div>
								<div class="calc-status" id="calc-status">Ready.</div>
							</div>

							<div class="calc-tabs">
								<button type="button" class="calc-tab active" data-calc-tab="scientific">Scientific</button>
								<button type="button" class="calc-tab" data-calc-tab="algebra">Algebra</button>
								<button type="button" class="calc-tab" data-calc-tab="pi">Pi Tools</button>
								<button type="button" class="calc-tab" data-calc-tab="history">History</button>
							</div>

							<div class="calc-panel" data-calc-panel="scientific">
								<input id="calc-expression" class="calc-input" type="text" placeholder="Expression" autocomplete="off" spellcheck="false" />
								<div class="calc-toolbar">
									<button type="button" class="calc-btn" data-calc-preset="sin(pi/6)">sin</button>
									<button type="button" class="calc-btn" data-calc-preset="cos(pi/3)">cos</button>
									<button type="button" class="calc-btn" data-calc-preset="tan(pi/4)">tan</button>
									<button type="button" class="calc-btn" data-calc-preset="sqrt(144)">√</button>
								</div>
								<div class="calc-keypad">
									<button type="button" class="calc-btn danger" data-calc-action="clear">C</button>
									<button type="button" class="calc-btn" data-calc-action="backspace">⌫</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="(">(</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value=")">)</button>

									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="7">7</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="8">8</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="9">9</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="/">÷</button>

									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="4">4</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="5">5</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="6">6</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="*">×</button>

									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="1">1</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="2">2</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="3">3</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="-">−</button>

									<button type="button" class="calc-btn wide" data-calc-action="insert" data-calc-value="0">0</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value=".">.</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="+">+</button>
								</div>
								<div class="calc-grid-3">
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="pi">π</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="e">e</button>
									<button type="button" class="calc-btn primary" data-calc-action="solve">Solve</button>
								</div>
								<div class="calc-grid-2">
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="^">x^y</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="%">%</button>
								</div>
								<div class="calc-toolbar">
									<button type="button" class="calc-btn" data-calc-action="insert-fn" data-calc-value="ln">ln</button>
									<button type="button" class="calc-btn" data-calc-action="insert-fn" data-calc-value="log">log</button>
									<button type="button" class="calc-btn" data-calc-action="insert-fn" data-calc-value="abs">abs</button>
									<button type="button" class="calc-btn" data-calc-action="insert-fn" data-calc-value="round">round</button>
								</div>
								<div class="calc-toolbar">
									<button type="button" class="calc-btn" data-calc-action="use-answer">Ans</button>
									<button type="button" class="calc-btn" data-calc-action="memory-store">MS</button>
									<button type="button" class="calc-btn" data-calc-action="memory-recall">MR</button>
									<button type="button" class="calc-btn" data-calc-action="memory-add">M+</button>
								</div>
							</div>

							<div class="calc-panel hidden" data-calc-panel="algebra">
								<input id="calc-algebra-input" class="calc-input" type="text" placeholder="Equation" autocomplete="off" spellcheck="false" />
								<div class="calc-grid-2">
									<button type="button" class="calc-btn" data-calc-preset-algebra="2x+5=17">Linear</button>
									<button type="button" class="calc-btn" data-calc-preset-algebra="x^2-5x+6=0">Quadratic</button>
								</div>
								<button type="button" class="calc-btn primary" data-calc-action="solve-algebra">Solve Equation</button>
								<div class="calc-status" id="calc-algebra-status"></div>
							</div>

							<div class="calc-panel hidden" data-calc-panel="pi">
								<div class="calc-pi-grid">
									<input id="calc-pi-radius" class="calc-input" type="number" step="any" placeholder="r" />
									<input id="calc-pi-diameter" class="calc-input" type="number" step="any" placeholder="d" />
									<input id="calc-pi-sides" class="calc-input" type="number" step="1" placeholder="n" />
									<input id="calc-pi-decimals" class="calc-input" type="number" step="1" min="0" max="20" value="8" placeholder="dec" />
								</div>
								<button type="button" class="calc-btn primary" data-calc-action="pi-calc">Calculate π Tools</button>
								<div class="calc-grid-2">
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="pi">Insert π</button>
									<button type="button" class="calc-btn" data-calc-action="insert" data-calc-value="3.1415926535">Approx π</button>
								</div>
								<div class="calc-status" id="calc-pi-status"></div>
							</div>

							<div class="calc-panel hidden" data-calc-panel="history">
								<div class="calc-history" id="calc-history-list"></div>
							</div>
						</div>
					</section>

					<aside class="calc-card">
						<div class="calc-card-head">
						</div>
						<div class="calc-card-body">
								<div class="calc-grid-2">
								<button type="button" class="calc-btn" data-calc-action="insert-fn" data-calc-value="sqrt">√x</button>
								<button type="button" class="calc-btn" data-calc-action="insert-fn" data-calc-value="sin">sin(x)</button>
								<button type="button" class="calc-btn" data-calc-action="insert-fn" data-calc-value="cos">cos(x)</button>
								<button type="button" class="calc-btn" data-calc-action="insert-fn" data-calc-value="tan">tan(x)</button>
								<button type="button" class="calc-btn" data-calc-action="insert-fn" data-calc-value="log">log(x)</button>
								<button type="button" class="calc-btn" data-calc-action="insert-fn" data-calc-value="ln">ln(x)</button>
								<button type="button" class="calc-btn" data-calc-action="insert-fn" data-calc-value="round">round(x)</button>
								<button type="button" class="calc-btn" data-calc-action="insert-fn" data-calc-value="abs">|x|</button>
							</div>
							<div style="height: 0.9rem;"></div>
							<div class="calc-grid-2">
								<button type="button" class="calc-btn" data-calc-preset="pi * 2">2π</button>
								<button type="button" class="calc-btn" data-calc-preset="pi * r * r">πr²</button>
								<button type="button" class="calc-btn" data-calc-preset="(a+b)^2">(a+b)²</button>
								<button type="button" class="calc-btn" data-calc-preset="(x-3)(x+3)">(x-3)(x+3)</button>
							</div>
							<div style="height: 0.9rem;"></div>
							<div class="calc-grid-2">
								<button type="button" class="calc-btn" data-calc-action="copy-output">Copy Output</button>
								<button type="button" class="calc-btn" data-calc-action="clear-history">Clear History</button>
							</div>
						</div>
					</aside>
				</div>
			</div>
		`;
	}

	function insertAtCursor(input, value) {
		if (!input) {
			return;
		}
		const text = String(input.value || "");
		const insertion = String(value || "");
		const start = Number.isFinite(input.selectionStart) ? input.selectionStart : text.length;
		const end = Number.isFinite(input.selectionEnd) ? input.selectionEnd : text.length;
		input.value = `${text.slice(0, start)}${insertion}${text.slice(end)}`;
		const nextPos = start + insertion.length;
		input.focus();
		input.setSelectionRange(nextPos, nextPos);
	}

	async function copyOutput() {
		try {
			await navigator.clipboard.writeText(readInput("#calc-expression") || readInput("#calc-algebra-input") || readInput("#calc-pi-status") || "");
			setOutput("Copied.", true);
		} catch (_error) {
			setOutput("Could not copy to clipboard.", false);
		}
	}

	function solveScientific() {
		const input = state.root ? state.root.querySelector("#calc-expression") : null;
		const expression = String(input ? input.value : "").trim();
		const answer = evaluateExpression(expression);
		state.lastAnswer = answer;
		const formatted = formatNumber(answer);
		setOutput(formatted, true);
		setHistoryEntry(expression, formatted);
		const status = state.root ? state.root.querySelector("#calc-status") : null;
		if (status) {
			status.textContent = `Solved ${expression} = ${formatted}`;
		}
		return formatted;
	}

	function solveAlgebra() {
		const input = state.root ? state.root.querySelector("#calc-algebra-input") : null;
		const expression = String(input ? input.value : "").trim();
		const result = solveEquation(expression);
		setOutput(result, true);
		setHistoryEntry(expression, result);
		const status = state.root ? state.root.querySelector("#calc-algebra-status") : null;
		if (status) {
			status.textContent = result;
		}
		return result;
	}

	function solvePi() {
		const result = piTools();
		setOutput(result, true);
		setHistoryEntry("π tools", result.replace(/\n/g, " | "));
		const status = state.root ? state.root.querySelector("#calc-pi-status") : null;
		if (status) {
			status.textContent = result;
		}
		return result;
	}

	function clearInput() {
		const input = state.root ? state.root.querySelector("#calc-expression") : null;
		if (input) {
			input.value = "";
			input.focus();
		}
		setOutput("0", true);
		setStatus("Ready.", true);
	}

	function backspaceInput() {
		const input = state.root ? state.root.querySelector("#calc-expression") : null;
		if (!input) {
			return;
		}
		const text = String(input.value || "");
		const start = Number.isFinite(input.selectionStart) ? input.selectionStart : text.length;
		const end = Number.isFinite(input.selectionEnd) ? input.selectionEnd : text.length;
		if (start !== end) {
			input.value = `${text.slice(0, start)}${text.slice(end)}`;
			input.setSelectionRange(start, start);
		} else if (start > 0) {
			input.value = `${text.slice(0, start - 1)}${text.slice(end)}`;
			input.setSelectionRange(start - 1, start - 1);
		}
		input.focus();
	}

	function handleAction(action, value) {
		const scientific = state.root ? state.root.querySelector("#calc-expression") : null;
		const algebra = state.root ? state.root.querySelector("#calc-algebra-input") : null;
		const activePanel = state.mode;

		switch (action) {
			case "insert":
				insertAtCursor(scientific, value);
				return;
			case "insert-fn":
				insertAtCursor(scientific, `${value}(`);
				return;
			case "insert-pi":
				insertAtCursor(scientific, "pi");
				return;
			case "use-answer":
				insertAtCursor(scientific, "Ans");
				return;
			case "clear":
				clearInput();
				return;
			case "backspace":
				backspaceInput();
				return;
			case "solve":
				if (activePanel === "scientific") {
					solveScientific();
				}
				return;
			case "solve-algebra":
				solveAlgebra();
				return;
			case "pi-calc":
				solvePi();
				return;
			case "toggle-angle":
				state.angleMode = state.angleMode === "deg" ? "rad" : "deg";
				render();
				renderModePanel();
				return;
			case "memory-read":
			case "memory-recall":
				if (scientific) {
					insertAtCursor(scientific, formatNumber(state.memory));
				}
				return;
			case "memory-store":
				try {
					state.memory = evaluateExpression(String(scientific ? scientific.value : "") || String(algebra ? algebra.value : "") || "0");
					setOutput(`Stored ${formatNumber(state.memory)} in memory.`, true);
					render();
				} catch (error) {
					setOutput(error && error.message ? error.message : "Could not store memory.", false);
				}
				return;
			case "memory-add":
				try {
					const next = evaluateExpression(String(scientific ? scientific.value : "") || String(algebra ? algebra.value : "") || "0");
					state.memory += next;
					setOutput(`Memory = ${formatNumber(state.memory)}`, true);
					render();
				} catch (error) {
					setOutput(error && error.message ? error.message : "Could not update memory.", false);
				}
				return;
			case "memory-clear":
				state.memory = 0;
				setOutput("Memory cleared.", true);
				render();
				return;
			case "copy-output":
				copyOutput();
				return;
			case "clear-history":
				state.history = [];
				renderHistory();
				setOutput("History cleared.", true);
				return;
			default:
				return;
		}
	}

	function bindEvents() {
		if (!state.root) {
			return;
		}

		state.root.addEventListener("click", async (event) => {
			const target = event.target instanceof Element ? event.target.closest("[data-calc-action], [data-calc-tab], [data-calc-preset], [data-calc-preset-algebra]") : null;
			if (!target) {
				return;
			}

			const tab = target.getAttribute("data-calc-tab");
			if (tab) {
				state.mode = tab;
				renderModePanel();
				return;
			}

			const preset = target.getAttribute("data-calc-preset");
			if (preset) {
				if (state.mode === "scientific") {
					applyPreset(preset);
				}
				return;
			}

			const algebraPreset = target.getAttribute("data-calc-preset-algebra");
			if (algebraPreset) {
				const input = state.root.querySelector("#calc-algebra-input");
				if (input) {
					input.value = algebraPreset;
					input.focus();
				}
				return;
			}

			const action = target.getAttribute("data-calc-action");
			if (action) {
				handleAction(action, target.getAttribute("data-calc-value") || "");
			}
		});

		state.root.addEventListener("submit", (event) => {
			event.preventDefault();
		});

		state.root.addEventListener("keydown", (event) => {
			const node = event.target;
			if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) {
				return;
			}
			if (event.key === "Enter") {
				if (node.id === "calc-expression") {
					event.preventDefault();
					solveScientific();
				}
				if (node.id === "calc-algebra-input") {
					event.preventDefault();
					solveAlgebra();
				}
			}
		});

		state.root.addEventListener("input", (event) => {
			const node = event.target;
			if (node instanceof HTMLInputElement && node.id === "calc-expression") {
				const display = state.root.querySelector("#calc-output");
				if (display && String(node.value || "").trim()) {
					display.textContent = node.value;
					display.classList.remove("is-error");
					display.classList.add("is-ok");
				}
			}
		});
	}

	function render() {
		if (!state.root) {
			return;
		}
		state.root.innerHTML = buildShell();
		renderModePanel();
		renderHistory();
		setOutput("0", true);
		const status = state.root.querySelector("#calc-status");
		if (status) {
			status.textContent = "Ready.";
		}
		animateIn(state.root.querySelector(".calc-shell"), 0);
	}

	function mount(selector) {
		state.root = document.querySelector(selector);
		if (!state.root) {
			return;
		}
		render();
		bindEvents();
		setTimeout(() => {
			const input = state.root ? state.root.querySelector("#calc-expression") : null;
			if (input) {
				input.focus();
			}
		}, 50);
	}

	function unmount() {
		state.root = null;
	}

	modules["/calc"] = {
		render: function renderCalcRoute() {
			return '<div id="calc-root"></div>';
		},
		afterRender: function afterRenderCalcRoute() {
			mount("#calc-root");
		}
	};

	window.NebulaCalc = {
		mount,
		unmount,
		evaluateExpression,
		solveEquation
	};
})();
