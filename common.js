const extension = "external";

function splitRule(rule) {
  const [name, alias = `require('${name}')`] = rule
    .split("=>")
    .map(m => m.trim());

  return {
    name,
    alias
  };
}

module.exports = {
  extension,
  splitRule
};
