import React from 'react';
import { ArrowLeft, Camera, WifiOff, Save, AlertTriangle } from 'lucide-react';

interface ManualModalProps {
  onClose: () => void;
}

export const ManualModal: React.FC<ManualModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-white z-[60] overflow-y-auto animate-in slide-in-from-bottom duration-300">
      <div className="bg-white/90 backdrop-blur p-4 border-b sticky top-0 flex items-center gap-3 z-10 safe-area-top">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <h2 className="font-bold text-xl text-slate-800">取扱説明書</h2>
      </div>
      
      <div className="p-5 space-y-8 max-w-2xl mx-auto pb-20">
        <section>
          <div className="flex items-center gap-2 mb-3 text-blue-800">
            <Camera className="w-6 h-6" />
            <h3 className="font-bold text-lg">1. 写真について</h3>
          </div>
          <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
            写真は最大3枚まで添付可能です。撮影時に写真の位置情報（緯度・経度・高度）と撮影日時が自動的に読み込まれます。
            <br/><br/>
            <span className="text-xs text-slate-500">* 位置情報を取得するにはカメラの利用許可が必要です。</span>
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3 text-blue-800">
            <Save className="w-6 h-6" />
            <h3 className="font-bold text-lg">2. データの入力</h3>
          </div>
          <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
            「新規」ボタンを押すか、最後のページまで進むと新しい記録を作成できます。必須項目を入力し、写真を撮影してください。
            「保存」を押すとデータが確定します。
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3 text-blue-800">
            <WifiOff className="w-6 h-6" />
            <h3 className="font-bold text-lg">3. オフライン機能</h3>
          </div>
          <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
            電波がない場所でも「保存」可能です。データは一時的に端末内に保存されます。
            <br/><br/>
            電波が入る場所に戻ったら、画面右上の<span className="font-bold text-blue-600">同期ボタン（雲アイコン）</span>を押してデータをサーバーに送信してください。
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="font-bold text-lg">4. スプレッドシートの列ずれについて</h3>
          </div>
          <p className="text-slate-700 leading-relaxed bg-amber-50 p-4 rounded-lg border border-amber-100">
            スプレッドシートに「色度」などの新しい列を追加した場合は、必ず<strong>Google Apps Script (GAS) コードも更新</strong>してください。
            <br/><br/>
            GASが古いまま利用すると、保存時に列がずれる原因になります。GASエディタでコードを更新後、「デプロイ」→「新しいデプロイ」を実行してください。
          </p>
        </section>
      </div>
    </div>
  );
};