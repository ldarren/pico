#include <v8.h> // v8 is the Javascript engine used by Node
#include <node.h>
#include <string>

using namespace v8;

class SampleLogic : node::ObjectWrap {
  private:
  public:
  SampleLogic() {}
  ~SampleLogic() {}

  std::string message;

  static v8::Persistent<FunctionTemplate> pft;

  static void Init(Handle<Object> target) {
    v8::Local<FunctionTemplate> lft = v8::FunctionTemplate::New(New);
    SampleLogic::pft = v8::Persistent<FunctionTemplate>::New(lft);
    SampleLogic::pft->InstanceTemplate()->SetInternalFieldCount(1);
    SampleLogic::pft->SetClassName(v8::String::NewSymbol("SampleLogic")); // what is the use?

    SampleLogic::pft->InstanceTemplate()->SetAccessor(String::New("message"), GetMessage, SetMessage);

    NODE_SET_PROTOTYPE_METHOD(SampleLogic::pft, "read", Read);

    target->Set(String::NewSymbol("Logic"), SampleLogic::pft->GetFunction()); // new module.Logic
  }

  static Handle<Value> New(const Arguments &args){
    HandleScope scope;
    SampleLogic *logic = new SampleLogic();
    logic->message = "Hello World";
    logic->Wrap(args.This());
    return args.This();
  }

  static v8::Handle<Value> Read(const Arguments &args){
    v8::HandleScope scope;
    SampleLogic *logic = node::ObjectWrap::Unwrap<SampleLogic>(args.This());

    return v8::String::New(logic->message.c_str());
  }

  static v8::Handle<Value> GetMessage(v8::Local<v8::String> property, const v8::AccessorInfo &info){
    SampleLogic *logic = node::ObjectWrap::Unwrap<SampleLogic>(info.Holder());
    return v8::String::New(logic->message.c_str());
  }

  static void SetMessage(Local<String> property, Local<Value> value, const AccessorInfo &info){
    SampleLogic *logic = node::ObjectWrap::Unwrap<SampleLogic>(info.Holder());
    v8::String::Utf8Value v8str(value);
    logic->message = *v8str;
  }
};

v8::Persistent<FunctionTemplate> SampleLogic::pft;
extern "C"{
  static void init(Handle<Object> target){
    SampleLogic::Init(target);
  }

  NODE_MODULE(sample_logic, init); // first parameter must same as filename
}
