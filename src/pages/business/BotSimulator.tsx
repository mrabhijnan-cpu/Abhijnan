export default function BotSimulator() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
      <div className="w-16 h-16 bg-karma-green/20 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-2xl">🤖</span>
      </div>
      <h2 className="text-3xl font-display font-bold text-karma-white mb-4">Business Bot Simulator</h2>
      <p className="text-gray-400 max-w-md">
        This feature is coming soon in Phase 3. You will be able to test your FAQ brain, customize greetings, and see fallback responses.
      </p>
    </div>
  );
}
