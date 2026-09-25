// ─── Hidden execution harness: JSON-ish reader / printer helpers ───
static void __ws(const string& s, size_t& i) { while (i < s.size() && isspace((unsigned char)s[i])) i++; }
static void __read(const string& s, size_t& i, int& v) { __ws(s, i); size_t n; v = (int)stoll(s.substr(i), &n); i += n; }
static void __read(const string& s, size_t& i, long long& v) { __ws(s, i); size_t n; v = stoll(s.substr(i), &n); i += n; }
static void __read(const string& s, size_t& i, double& v) { __ws(s, i); size_t n; v = stod(s.substr(i), &n); i += n; }
static void __read(const string& s, size_t& i, bool& v) {
  __ws(s, i);
  if (s.compare(i, 4, "true") == 0) { v = true; i += 4; } else { v = false; i += 5; }
}
static void __read(const string& s, size_t& i, string& v) {
  __ws(s, i); v.clear();
  if (i < s.size() && s[i] == '"') {
    i++;
    while (i < s.size() && s[i] != '"') {
      if (s[i] == '\\' && i + 1 < s.size()) { i++; char e = s[i]; v += (e == 'n') ? '\n' : (e == 't') ? '\t' : e; }
      else v += s[i];
      i++;
    }
    i++;
  } else { v = s.substr(i); i = s.size(); }
}
static void __read(const string& s, size_t& i, char& v) { string t; __read(s, i, t); v = t.empty() ? ' ' : t[0]; }
template <class T> static void __read(const string& s, size_t& i, vector<T>& v) {
  __ws(s, i); v.clear();
  if (i >= s.size() || s[i] != '[') return;
  i++;
  while (true) {
    __ws(s, i);
    if (i >= s.size() || s[i] == ']') { i++; break; }
    T x{}; __read(s, i, x); v.push_back(x);
    __ws(s, i);
    if (i < s.size() && s[i] == ',') i++;
  }
}
static void __json(ostream& o, int v) { o << v; }
static void __json(ostream& o, long long v) { o << v; }
static void __json(ostream& o, double v) { ostringstream t; t << setprecision(10) << v; o << t.str(); }
static void __json(ostream& o, bool v) { o << (v ? "true" : "false"); }
static void __json(ostream& o, char v) { o << '"' << v << '"'; }
static void __json(ostream& o, const string& v) {
  o << '"';
  for (char c : v) { if (c == '"' || c == '\\') o << '\\'; o << c; }
  o << '"';
}
template <class T> static void __json(ostream& o, const vector<T>& v) {
  o << '[';
  for (size_t k = 0; k < v.size(); k++) { if (k) o << ','; __json(o, v[k]); }
  o << ']';
}
static void __json(ostream& o, const vector<bool>& v) {
  o << '[';
  for (size_t k = 0; k < v.size(); k++) { if (k) o << ','; o << (v[k] ? "true" : "false"); }
  o << ']';
}
static void __printTop(const string& v) { cout << v << endl; }
template <class T> static void __printTop(const T& v) { __json(cout, v); cout << endl; }
